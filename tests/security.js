/* Local security regressions. No external requests, real credentials, or publication. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const childProcess = require('node:child_process');
const { restrictedPath, checkRepository, validateOutput } = require('../scripts/check-public-files');
const policy = require('../scripts/public-policy');
const { exportPublic } = require('../scripts/export-public');
const { createServer } = require('../scripts/serve');

async function verify() {
  let checks = 0;
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'pathways-security-test-'));
  const root = path.resolve(__dirname, '..');
  const servers = [];
  try {
    for (const file of ['data/people.local.js','data/notes.local.json','assets/private/portrait.jpg','.env','.env.production','nested/.env.local','private.pem','identity.pfx','.security-audit/result.json','dist/data/example.js','backup.dump']) { assert.ok(restrictedPath(file)); checks++; }
    for (const file of ['.env.example','js/local-data.js','js/app.js','data/people.example.js','package-lock.json','assets/fonts/Poppins-OFL.txt','schema.sql']) { assert.equal(restrictedPath(file), null); checks++; }
    const fixture = path.join(temporary, 'repository'); fs.mkdirSync(fixture);
    const git = args => childProcess.execFileSync('git', ['-C', fixture].concat(args), { encoding: 'utf8', stdio: ['ignore','pipe','pipe'] });
    git(['init','--quiet','--initial-branch=main']);
    fs.mkdirSync(path.join(fixture, 'data')); fs.writeFileSync(path.join(fixture, '.gitignore'), '/data/people.local.js\n'); fs.writeFileSync(path.join(fixture, 'data/people.local.js'), 'window.DP_LOCAL_PEOPLE = [];\n');
    git(['add','-f','--','data/people.local.js']);
    assert.equal(checkRepository(fixture)[0].file, 'data/people.local.js'); checks++;
    git(['rm','--cached','--','data/people.local.js']); assert.equal(checkRepository(fixture).length, 0); assert.ok(fs.existsSync(path.join(fixture, 'data/people.local.js'))); checks++;

    const localDataPath = path.join(root, 'data/people.local.js');
    const sourceData = fs.existsSync(localDataPath) ? fs.readFileSync(localDataPath) : null;
    const output = path.join(temporary, 'public-site'); const exported = exportPublic({ output });
    assert.ok(!fs.existsSync(path.join(output, 'data/people.local.js'))); checks++;
    assert.equal(validateOutput(output).ok, true); checks++;
    if (sourceData) assert.deepEqual(fs.readFileSync(localDataPath), sourceData);
    else assert.ok(!fs.existsSync(localDataPath));
    checks++;
    for (const file of ['scripts','tests','assets/private','.git','.env','SECURITY.md','README.md']) { assert.ok(!fs.existsSync(path.join(output, file))); checks++; }
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'scripts/public-files.json'), 'utf8'));
    for (const file of manifest) { assert.deepEqual(fs.readFileSync(path.join(output, file)), policy.publicFile(root, file)); checks++; }
    assert.equal(exported.files, manifest.length); assert.ok(fs.existsSync(path.join(output, '.nojekyll'))); checks++;
    assert.throws(() => exportPublic({ output }), /already exists/); checks++;

    for (const file of ['js/local-data.js','js/demo-data.js']) { assert.ok(!fs.existsSync(path.join(output, file))); checks++; }
    const extra = path.join(output, 'unexpected.js'); fs.writeFileSync(extra, '/* unexpected */');
    assert.equal(validateOutput(output).ok, false); checks++; fs.unlinkSync(extra);
    const appPath = path.join(output, 'js/app.js'); const originalApp = fs.readFileSync(appPath);
    fs.appendFileSync(appPath, '\nconst accidental = "' + ['gh','p_'].join('') + 'A'.repeat(36) + '";');
    const secretResult = validateOutput(output); assert.ok(secretResult.issues.some(item => item.category === 'github-token')); checks++;
    let failure; try { childProcess.execFileSync(process.execPath, [path.join(root,'scripts/check-public-files.js'),'--output',output], {stdio:['ignore','pipe','pipe']}); } catch (error) { failure = error; }
    assert.equal(failure.status, 1); assert.ok(!failure.stderr.toString().includes('A'.repeat(36))); checks++;
    fs.writeFileSync(appPath, originalApp);
    const homePath = path.join(output,'index.html'); const home = fs.readFileSync(homePath); fs.unlinkSync(homePath);
    assert.equal(validateOutput(output).ok, false); checks++; fs.writeFileSync(homePath, home);
    assert.equal(validateOutput(output).ok, true); checks++;
    const noPrivateData = { hashes: new Set(), fingerprints: new Set(['syntheticconfidentialmarker']) };
    assert.ok(policy.inspectBuffer('copy.js', Buffer.from('synthetic%20confidential%20marker'), noPrivateData).some(item => item.category === 'private record fingerprint')); checks++;
    const confidentialBytes = Buffer.from('synthetic private binary fixture');
    assert.ok(policy.inspectBuffer('renamed.woff2', confidentialBytes, { hashes: new Set([policy.digest(confidentialBytes)]), fingerprints: new Set() }).some(item => item.category === 'private file content copied')); checks++;
    assert.ok(policy.inspectBuffer('unsafe.svg', Buffer.from('<svg><image href="https://example.invalid/image.png"/></svg>'), {hashes:new Set(),fingerprints:new Set()}).length); checks++;
    for (const encoded of ['synthetic\\u0020confidential\\u0020marker','synthetic&#32;confidential&#32;marker']) { assert.ok(policy.inspectBuffer('copy.js', Buffer.from(encoded), noPrivateData).some(item => item.category === 'private record fingerprint')); checks++; }
    for (const svg of ['<svg onload="x"/>','<svg><script>x</script></svg>','<svg><use href="https://example.invalid/a.svg"/></svg>']) { assert.ok(policy.inspectBuffer('unsafe.svg', Buffer.from(svg), {hashes:new Set(),fingerprints:new Set()}).length); checks++; }
    const manifestSource = path.join(temporary, 'manifest-source'); fs.mkdirSync(path.join(manifestSource,'scripts'), {recursive:true});
    for (const name of ['../escape.js','assets\\private\\hidden.js','data/people.local.js','assets/private/hidden.svg','tests/hidden.js','JS/APP.JS']) {
      fs.writeFileSync(path.join(manifestSource,'scripts/public-files.json'), JSON.stringify(manifest.concat(name)));
      assert.throws(() => policy.manifest(manifestSource)); checks++;
    }
    fs.writeFileSync(path.join(manifestSource,'scripts/public-files.json'), JSON.stringify(manifest.filter(file => file !== 'index.html')));
    assert.throws(() => policy.manifest(manifestSource)); checks++;
    const existing = path.join(temporary, 'existing-public'); fs.mkdirSync(existing); fs.mkdirSync(path.join(existing,'.git')); fs.writeFileSync(path.join(existing,'.git','marker'), 'preserve');
    assert.throws(() => exportPublic({ output: existing }), /already exists/); assert.equal(fs.readFileSync(path.join(existing,'.git','marker'),'utf8'), 'preserve'); checks++;

    const secretFixture = path.join(temporary, 'outside-public'); fs.mkdirSync(secretFixture); fs.writeFileSync(path.join(secretFixture, 'fixture.js'), '/* outside static root: synthetic fixture */');
    fs.symlinkSync(secretFixture, path.join(output, 'assets/linked-outside'), process.platform === 'win32' ? 'junction' : 'dir');
    fs.mkdirSync(path.join(output, 'private-fixture')); fs.writeFileSync(path.join(output, 'private-fixture/fixture.js'), '/* non-public path: synthetic fixture */');
    fs.symlinkSync(path.join(output, 'private-fixture'), path.join(output, 'assets/linked-inside'), process.platform === 'win32' ? 'junction' : 'dir');
    assert.ok(validateOutput(output).issues.some(item => item.category === 'symlink or junction')); checks++;
    const server = createServer({ root: output }); servers.push(server);
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const port = server.address().port;
    function request(route, headers = {}) { return new Promise((resolve, reject) => { const req = http.get({ hostname: '127.0.0.1', port, path: route, headers }, response => { const chunks = []; response.on('data', chunk => chunks.push(chunk)); response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks) })); }); req.on('error', reject); }); }
    for (const route of ['/', '/directory/?category=fsj', '/profile/?id=arif-hasan', '/js/app.js', '/data/people.public.js']) {
      const result = await request(route); assert.equal(result.status, 200); assert.equal(result.headers['cross-origin-resource-policy'], 'same-origin'); assert.equal(result.headers['referrer-policy'], 'no-referrer'); assert.equal(result.headers['x-content-type-options'], 'nosniff'); checks++;
    }
    assert.equal((await request('/data/people.local.js')).status, 404); checks++;
    assert.ok((await request('/data/people.public.js')).body.toString().includes('DP_PUBLIC_PEOPLE = []')); checks++;
    for (const host of ['attacker.invalid:' + port,'127.0.0.1.attacker.invalid:' + port,'127.0.0.1:1','attacker.invalid']) { assert.equal((await request('/data/people.local.js', { Host: host })).status, 421); checks++; }
    assert.equal((await request('/', { Host: 'localhost:' + port })).status, 200); checks++;
    for (const route of ['/assets/linked-outside/fixture.js','/assets/linked-inside/fixture.js','/private-fixture/fixture.js','/scripts/serve.js','/.git/config','/.env']) { assert.equal((await request(route)).status, 404); checks++; }
    console.log(checks + ' publication, export, Host validation, header, and symlink security checks passed.');
  } finally {
    for (const server of servers) await new Promise(resolve => server.close(resolve));
    const resolved = path.resolve(temporary); const parent = path.resolve(os.tmpdir());
    if (path.dirname(resolved) !== parent || !path.basename(resolved).startsWith('pathways-security-test-')) throw new Error('Refusing to clean an unexpected test path');
    fs.rmSync(resolved, { recursive: true, force: true });
  }
}

verify().catch(error => { console.error(error.code === 'EPERM' ? 'Security checks need permission to launch local Git and create temporary test junctions.' : error.message); process.exitCode = 1; });
