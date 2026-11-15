/* Check the actual Git index or a complete generated public directory. */
'use strict';
const fs = require('node:fs');
const childProcess = require('node:child_process');
const path = require('node:path');
const policy = require('./public-policy');

function checkRepository(directory) {
  const git = args => childProcess.execFileSync('git', ['-C', directory].concat(args), { encoding: 'utf8', stdio: ['ignore','pipe','pipe'], maxBuffer: 32 * 1024 * 1024 });
  const bare = git(['rev-parse', '--is-bare-repository']).trim() === 'true';
  return git(bare ? ['ls-tree','-r','-z','--name-only','HEAD'] : ['ls-files','-z','--cached','--full-name']).split('\0').filter(Boolean).map(file => ({ file, reason: policy.restrictedPath(file) })).filter(item => item.reason);
}
function validateOutput(directory, options = {}) {
  const source = fs.realpathSync(options.source || path.join(__dirname, '..'));
  const requested = path.resolve(directory); const root = fs.realpathSync(requested);
  if (!policy.samePath(requested, root)) throw new Error('Public root may not be a symbolic link or junction');
  const expected = policy.sourcePlan(source); const allowedDirectories = new Set();
  for (const file of expected.keys()) { let parent = path.posix.dirname(file); while (parent !== '.') { allowedDirectories.add(parent); parent = path.posix.dirname(parent); } }
  const privateData = policy.privacy(source); const found = new Map(); const issues = [];
  function issue(file, category) { issues.push({ file: /(?:^|\/)private\//i.test(file) ? '[private path]' : file, category }); }
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name); const file = path.relative(root, absolute).replace(/\\/g, '/');
      if (entry.isSymbolicLink() || !policy.samePath(absolute, fs.realpathSync(absolute))) { issue(file, 'symlink or junction'); continue; }
      if (entry.isDirectory()) { if (!allowedDirectories.has(file)) issue(file, 'unexpected directory'); walk(absolute); continue; }
      if (!entry.isFile()) { issue(file, 'non-regular file'); continue; }
      if (policy.forbiddenOutput(file) || !expected.has(file)) issue(file, 'file not approved for public output');
      const stat = fs.statSync(absolute); if (stat.size > 20 * 1024 * 1024) { issue(file, 'unexpected file size'); continue; }
      const bytes = fs.readFileSync(absolute); found.set(file, bytes);
      if (expected.has(file) && !bytes.equals(expected.get(file))) issue(file, 'export integrity mismatch');
      issues.push(...policy.inspectBuffer(file, bytes, privateData));
    }
  }
  walk(root);
  for (const file of expected.keys()) if (!found.has(file)) issue(file, 'required allowlisted file missing');
  function reference(ref, base) {
    if (!ref || ref.startsWith('mailto:') || /^https:\/\/(?:www\.|m\.)?facebook\.com\//.test(ref)) return;
    try {
      const url = new URL(ref, base); const prefix = '/deutschland-pathways/';
      if (url.origin !== 'https://public.invalid' || !url.pathname.startsWith(prefix)) { issue(base.pathname.slice(prefix.length), 'external or escaping asset/navigation reference'); return; }
      let file = decodeURIComponent(url.pathname.slice(prefix.length)); if (!file || file.endsWith('/')) file += 'index.html';
      if (!found.has(file)) issue(file, 'referenced asset or route missing');
      else if (url.hash && file.endsWith('.html') && !new RegExp('\\bid=["\x27]' + url.hash.slice(1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '["\x27]').test(found.get(file).toString())) issue(file, 'fragment target missing');
    } catch (_) { issue('[reference]', 'invalid asset/navigation URL'); }
  }
  for (const [file, bytes] of found) {
    if (file.endsWith('.html')) {
      const html = bytes.toString(); const page = new URL(file, 'https://public.invalid/deutschland-pathways/');
      const base = new URL((html.match(/<base href="([^"]+)"/) || [])[1] || page, page);
      for (const match of html.matchAll(/<(?!base\b)[a-z][^>]*\b(?:src|href)="([^"]+)"[^>]*>/gi)) reference(match[1], base);
      if (/js\/(?:local-data|demo-data)\.js|data\/people\.local\.js/.test(html)) issue(file, 'private or demo data bootstrap');
    }
    if (file.endsWith('.css')) for (const match of bytes.toString().matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)) reference(match[1], new URL(file, 'https://public.invalid/deutschland-pathways/'));
  }
  let publicRecords = null;
  if (['js/data.js','data/people.public.js','js/public-data.js'].every(file => found.has(file))) {
    try { publicRecords = policy.verifyPublicData(found); } catch (_) { issue('data/people.public.js', 'invalid or non-public dataset'); }
  }
  return { ok: issues.length === 0, files: found.size, publicRecords, privateRecordsChecked: privateData.privateRecords, privateAssetsChecked: privateData.privateAssets, issues };
}

module.exports = { restrictedPath: policy.restrictedPath, checkRepository, validateOutput };
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || !['--repo','--output'].includes(args[0]))) { console.error('Usage: node scripts/check-public-files.js [--repo PATH | --output PATH]'); process.exitCode = 2; }
  else {
    try {
      if (args[0] === '--output') {
        const result = validateOutput(args[1]);
        if (!result.ok) { console.error('Public output validation failed; values are redacted.'); result.issues.forEach(item => console.error(item.file + ': ' + item.category)); process.exitCode = 1; }
        else console.log('Public output passed: ' + result.files + ' allowlisted files; ' + result.publicRecords + ' approved records; no private data detected.');
      } else {
        const issues = checkRepository(path.resolve(args[1] || path.join(__dirname, '..')));
        if (issues.length) { console.error('Publication blocked: restricted files are tracked. Contents are not printed.'); issues.forEach(item => console.error(item.file + ': ' + item.reason)); process.exitCode = 1; }
        else console.log('Tracked-path check passed. A separate redacted secret/history audit is still required.');
      }
    } catch (_) { console.error('Security validation could not complete. Verify the path, source metadata, and local Git permissions; no passing result is implied.'); process.exitCode = 2; }
  }
}
