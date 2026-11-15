/* Validate a temporary static export before creating a separate public directory. */
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const policy = require('./public-policy');
const { validateOutput } = require('./check-public-files');

function exportPublic(options = {}) {
  const source = fs.realpathSync(options.source || path.join(__dirname, '..'));
  const output = path.resolve(options.output || path.join(source, 'dist'));
  if (fs.existsSync(output)) throw new Error('Output already exists; nothing was overwritten');
  if (!policy.samePath(path.dirname(output), fs.realpathSync(path.dirname(output)))) throw new Error('Output parent must not be a symlink or junction');
  const plan = policy.sourcePlan(source); const privateData = policy.privacy(source);
  const issues = [...plan].flatMap(([file, bytes]) => policy.inspectBuffer(file, bytes, privateData));
  if (issues.length) throw new Error('Source content failed privacy/security checks; sensitive values are redacted');
  policy.verifyPublicData(plan);
  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'pathways-public-export-'));
  try {
    function write(root) { for (const [file, bytes] of plan) { const destination = path.join(root, file); fs.mkdirSync(path.dirname(destination), { recursive: true }); fs.writeFileSync(destination, bytes, { flag: 'wx' }); } }
    write(staging);
    const before = validateOutput(staging, { source }); if (!before.ok) throw new Error('Staged output failed validation');
    fs.mkdirSync(output); // Never remove, replace, or merge an existing public directory.
    write(output);
    const result = validateOutput(output, { source }); if (!result.ok) throw new Error('Final output failed validation; do not deploy it');
    return { output, files: plan.size, publicRecords: result.publicRecords };
  } finally {
    const resolved = path.resolve(staging);
    if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith('pathways-public-export-')) throw new Error('Refusing unexpected staging cleanup');
    fs.rmSync(resolved, { recursive: true, force: true });
  }
}
module.exports = { exportPublic };
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== '--output')) { console.error('Usage: node scripts/export-public.js [--output NEW_DIRECTORY]'); process.exitCode = 2; }
  else {
    try { const result = exportPublic({ output: args[1] }); console.log('Validated public export: ' + result.output + ' (' + result.files + ' files, ' + result.publicRecords + ' approved public records).'); }
    catch (error) { console.error('Export stopped: ' + error.message); process.exitCode = 1; }
  }
}
