'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { load } = require('./verify');
const { exportPublic } = require('../scripts/export-public');
const { validateOutput } = require('../scripts/check-public-files');
const { createServer } = require('../scripts/serve');

async function verify() {
  const container = fs.mkdtempSync(path.join(os.tmpdir(), 'pathways-public-test-'));
  const supplied = process.argv[2]; const output = supplied ? path.resolve(supplied) : path.join(container, 'website');
  let server; let checks = 0;
  try {
    if (!supplied) exportPublic({ output });
    const validation = validateOutput(output); assert.equal(validation.ok, true); assert.equal(validation.publicRecords, 0); checks++;
    const prefix = '/deutschland-pathways/';
    const home = await load('index', '', { root: output, pathname: prefix });
    assert.equal(home.byId('pathway-grid').children.length, 4); assert.equal(home.data.profiles.length, 0); assert.equal(home.data.mode, 'public'); checks++;
    assert.equal(home.byId('main').querySelectorAll('article').length, 0); checks++;
    for (const category of ['', 'ausbildung','fsj','bfd','au-pair']) for (const view of ['list','icon','full']) {
      const d = await load('directory', '?category=' + category + '&view=' + view, { root: output, pathname: prefix + 'directory/' });
      assert.equal(d.data.mode, 'public'); assert.equal(d.data.profiles.length, 0); assert.equal(d.byId('directory-results').dataset.view, view);
      assert.equal(d.byId('empty-state').hidden, false); assert.equal(d.byId('empty-title').textContent, 'No public profiles yet.'); assert.equal(d.byId('dataset-label').textContent, 'PUBLIC DIRECTORY'); checks++;
      const input = d.byId('directory-search'); input.value = 'not-approved'; input.fire('input'); d.flush();
      assert.equal(d.byId('directory-results').children.length, 0); d.byId('reset-filters').fire('click'); assert.equal(d.byId('directory-results').dataset.view, view); checks++;
      d.byId('sort-filter').value = 'name-desc'; d.byId('sort-filter').fire('change'); assert.ok(d.sandbox.lastURL.startsWith(prefix + 'directory/')); checks++;
      assert.equal(d.byId('city-filter').querySelectorAll('option').length, 1); checks++;
    }
    const profile = await load('profile', '?id=not-approved', { root: output, pathname: prefix + 'profile/' });
    assert.equal(profile.document.title, 'Profile not found — Deutschland Pathways'); assert.equal(profile.byId('related-section').hidden, true); checks++;
    for (const page of ['index','directory','profile']) {
      const markup = fs.readFileSync(path.join(output, page === 'index' ? 'index.html' : page + '/index.html'), 'utf8');
      assert.doesNotMatch(markup, /(?:people\.local|local-data|demo-data)\.js/); checks++;
    }
    server = createServer({ root: output, basePath: prefix });
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const origin = 'http://127.0.0.1:' + server.address().port;
    function request(route) { return new Promise((resolve, reject) => { http.get(origin + route, response => { const chunks = []; response.on('data', chunk => chunks.push(chunk)); response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks) })); }).on('error', reject); }); }
    const files = JSON.parse(fs.readFileSync(path.join(__dirname, '../scripts/public-files.json'), 'utf8'));
    for (const file of files.filter(file => file !== '.nojekyll')) {
      const response = await request(prefix + file); const expectedRedirect = /^(?:index\.html|(?:directory|profile)(?:\/index)?\.html)$/.test(file);
      assert.equal(response.status, expectedRedirect ? 308 : 200); checks++;
    }
    for (const route of ['', 'directory/?category=fsj&view=list', 'profile/?id=not-approved']) for (let refresh = 0; refresh < 2; refresh++) { assert.equal((await request(prefix + route)).status, 200); checks++; }
    for (const route of ['data/people.local.js','assets/private/portrait.svg','js/local-data.js','js/demo-data.js','scripts/export-public.js','tests/security.js','.git/config','.env']) { assert.equal((await request(prefix + route)).status, 404); checks++; }
    for (const [from, to] of [['index.html',''],['directory.html','directory/'],['profile.html','profile/'],['directory','directory/'],['profile','profile/']]) {
      const response = await request(prefix + from + '?view=list&category=fsj'); assert.equal(response.status, 308); assert.equal(response.headers.location, prefix + to + '?view=list&category=fsj'); checks++;
    }
    assert.equal((await request('/js/app.js')).status, 404); checks++;
    console.log(checks + ' generated-public DOM, empty-data, control, asset, and project-path HTTP checks passed.');
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    const resolved = path.resolve(container);
    if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith('pathways-public-test-')) throw new Error('Unexpected test cleanup path');
    fs.rmSync(resolved, { recursive: true, force: true });
  }
}
verify().catch(error => { console.error(error.message); process.exitCode = 1; });
