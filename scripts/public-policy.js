'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const normalize = value => String(value).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{M}\p{N}]/gu, '');
const required = ['.nojekyll','index.html','directory.html','profile.html','directory/index.html','profile/index.html','css/main.css','css/components.css','css/responsive.css','css/animations.css','js/routes.js','js/data.js','js/public-data.js','js/app.js','js/directory.js','js/profile.js','js/legacy-route.js','data/people.public.js','assets/icons/logo.svg','assets/icons/favicon.svg','assets/images/avatar-fallback.svg','assets/fonts/SolaimanLipi.ttf'];

function restrictedPath(filename) {
  const name = filename.replace(/\\/g, '/'); const base = name.split('/').pop();
  if (/^(?:data\/.*\.local\.|assets\/private(?:\/|$))/i.test(name)) return 'local personal data or private assets';
  if (base !== '.env.example' && /^\.env(?:\.|$)/i.test(base)) return 'environment configuration';
  if (/\.(?:pem|key|p12|pfx|jks|keystore)$/i.test(base) || /^(?:id_rsa|id_ed25519)$/.test(base)) return 'key material requires review';
  if (/(?:^|\/)(?:\.security-audit|security-reports|backups|node_modules|coverage|dist(?:-[^/]*)?)\//i.test(name)) return 'report, backup, dependency, or build output';
  if (/\.(?:dump|backup|bak|sqlite|sqlite3)$/i.test(base) || /^gitleaks-report.*\.(?:json|sarif)$/i.test(base)) return 'database export, backup, or scan report';
  return null;
}
function forbiddenOutput(name) {
  return restrictedPath(name) || /(?:^|\/)\.env(?:\.|$)/i.test(name) || /(?:^|\/)(?:\.git|\.github|\.githooks|scripts|tests|private-documents)(?:\/|$)/i.test(name) || /^(?:README|SECURITY)\.md$/i.test(name) || /\.(?:map|exe|dll|bat|cmd|ps1|sh|zip|tar|gz)$/i.test(name) || /^js\/(?:local-data|demo-data)\.js$/.test(name);
}
function samePath(a, b) { return process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b; }
function regularFile(root, file) {
  const filename = path.resolve(root, file);
  if (!filename.startsWith(root + path.sep) || !samePath(filename, fs.realpathSync(filename)) || !fs.lstatSync(filename).isFile()) throw new Error('Non-regular or escaping public asset');
  return filename;
}
function manifest(source) {
  const files = JSON.parse(fs.readFileSync(path.join(source, 'scripts/public-files.json'), 'utf8'));
  if (!Array.isArray(files) || !files.length || files.some(file => typeof file !== 'string') || new Set(files.map(file => file.toLowerCase())).size !== files.length) throw new Error('Invalid or ambiguous public allowlist');
  for (const file of files) if ((file !== '.nojekyll' && (!/^(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)+$/.test(file) || file.split('/').some(part => part === '..') || path.isAbsolute(file))) || forbiddenOutput(file)) throw new Error('Forbidden public-asset manifest entry');
  if (required.some(file => !files.includes(file))) throw new Error('Required public asset missing from allowlist');
  return files;
}
function publicFile(source, file) {
  if (file === '.nojekyll') return Buffer.alloc(0);
  const bytes = fs.readFileSync(regularFile(source, file));
  if (!['index.html','directory/index.html','profile/index.html'].includes(file)) return bytes;
  let html = bytes.toString('utf8');
  const demo = '<script src="js/demo-data.js" defer></script>';
  if (!html.includes(demo)) throw new Error('Unrecognized page data bootstrap');
  html = html.replace(demo, '<script src="data/people.public.js" defer></script><script src="js/public-data.js" defer></script>').replace(/<script src="js\/local-data\.js" defer><\/script>/g, '');
  if (/js\/(?:local-data|demo-data)\.js/.test(html)) throw new Error('Private or demo loader remains in public page');
  return Buffer.from(html);
}
function sourcePlan(source) { return new Map(manifest(source).map(file => [file, publicFile(source, file)])); }
function decodeText(text) {
  return text.replace(/\\u\{([0-9a-f]{1,6})\}|\\u([0-9a-f]{4})|\\x([0-9a-f]{2})/gi, (_, a, b, c) => { const n = parseInt(a || b || c, 16); return n <= 0x10ffff ? String.fromCodePoint(n) : ''; })
    .replace(/(?:%[0-9a-f]{2})+/gi, value => { try { return decodeURIComponent(value); } catch (_) { return value; } })
    .replace(/&#(?:x([0-9a-f]+)|(\d+));/gi, (_, a, b) => { const n = parseInt(a || b, a ? 16 : 10); return n <= 0x10ffff ? String.fromCodePoint(n) : ''; });
}
function privacy(source) {
  const fingerprints = new Set(); const hashes = new Set(); const local = path.join(source, 'data/people.local.js');
  let privateRecords = 0; let privateAssets = 0;
  if (fs.existsSync(local)) {
    const context = { window: {} };
    vm.runInNewContext(fs.readFileSync(local, 'utf8'), context, { timeout: 1000, codeGeneration: { strings: false, wasm: false } });
    const rows = context.window.DP_LOCAL_PEOPLE;
    if (rows != null && !Array.isArray(rows)) throw new Error('Private data could not be inspected safely');
    privateRecords = (rows || []).length;
    for (const row of rows || []) for (const [key, value] of Object.entries(row)) {
      if (!/^(?:id|name|nameBn|facebookUrl|email|phone|address|passport|identification|description|bio|image|gallery)$/i.test(key)) continue;
      const strings = [];
      function values(item) { if (typeof item === 'string') strings.push(item); else if (Array.isArray(item)) item.forEach(values); else if (item && typeof item === 'object') Object.values(item).forEach(values); }
      values(value); for (const text of strings) { const token = normalize(text); if (token.length >= 4) fingerprints.add(token); }
    }
    const localBytes = fs.readFileSync(local); if (localBytes.length) hashes.add(digest(localBytes));
  }
  const privateRoot = path.join(source, 'assets/private');
  if (fs.existsSync(privateRoot)) {
    function walk(dir) { for (const item of fs.readdirSync(dir, { withFileTypes: true })) { const file = path.join(dir, item.name); if (item.isSymbolicLink()) continue; if (item.isDirectory()) walk(file); else if (item.isFile()) { privateAssets++; const bytes = fs.readFileSync(file); if (bytes.length) hashes.add(digest(bytes)); } } }
    walk(privateRoot);
  }
  return { fingerprints, hashes, privateRecords, privateAssets };
}
function secretKinds(text) {
  const rules = [
    ['private-key', /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/],
    ['github-token', /\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{30,})\b/],
    ['cloud-key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b|\bAIza[A-Za-z0-9_-]{35}\b/],
    ['payment-token', /\b(?:sk_live_|rk_live_)[A-Za-z0-9]{16,}\b/],
    ['chat-token', /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/],
    ['jwt-value', /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/],
    ['credential-connection-url', /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|amqps?):\/\/[^\s/:@]+:[^\s/@]+@/i],
    ['sensitive-assignment', /\b(?:password|passwd|client_secret|api_key|api_secret|access_token|refresh_token|service_role_key|smtp_password|webhook_secret)\b\s*[:=]\s*['"][A-Za-z0-9_+\/=.-]{12,}['"]/i]
  ];
  return rules.filter(([, rule]) => rule.test(text)).map(([kind]) => kind);
}
function inspectBuffer(file, bytes, privateData) {
  const issues = []; const text = bytes.toString('utf8');
  if (privateData.hashes.has(digest(bytes))) issues.push('private file content copied');
  const decoded = normalize(decodeText(text));
  if ([...privateData.fingerprints].some(token => decoded.includes(token))) issues.push('private record fingerprint');
  issues.push(...secretKinds(decodeText(text)));
  if (file.endsWith('.svg')) {
    if (/<(?:script|foreignObject|iframe|object|embed|image|a)\b|\s+on[a-z]+\s*=|<!DOCTYPE|<!ENTITY/i.test(text)) issues.push('active or embedded SVG content');
    for (const match of text.matchAll(/(?:href|src)\s*=\s*(['"])(.*?)\1/gi)) if (!match[2].startsWith('#')) issues.push('external SVG resource');
    for (const match of text.matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/gi)) if (!match[1].startsWith('#')) issues.push('external SVG resource');
  }
  if (file.endsWith('.woff2') && bytes.toString('ascii', 0, 4) !== 'wOF2') issues.push('invalid webfont content');
  if (file.endsWith('.ttf') && (bytes.length < 12 || ![0x00010000,0x4f54544f].includes(bytes.readUInt32BE(0)))) issues.push('invalid TrueType content');
  return [...new Set(issues)].map(category => ({ file, category }));
}
function verifyPublicData(files) {
  const context = { window: {} };
  for (const file of ['js/data.js','data/people.public.js','js/public-data.js']) vm.runInNewContext(files.get(file).toString('utf8'), context, { timeout: 1000, codeGeneration: { strings: false, wasm: false } });
  const data = context.window.DPData;
  if (!data || data.mode !== 'public' || data.profiles.some(person => person.isDemo)) throw new Error('Invalid public dataset');
  for (const person of data.profiles) for (const image of [person.image].concat(person.gallery.map(item => item.src)).filter(Boolean)) if (!files.has(image)) throw new Error('Public image is not allowlisted');
  return data.profiles.length;
}
module.exports = { required, digest, restrictedPath, forbiddenOutput, samePath, regularFile, manifest, publicFile, sourcePlan, privacy, secretKinds, inspectBuffer, verifyPublicData };
