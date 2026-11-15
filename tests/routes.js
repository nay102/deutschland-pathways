/* Real local HTTP checks; no browser, external requests, or package installation. */
'use strict';
const assert = require('node:assert/strict');
const http = require('node:http');
const { createServer } = require('../scripts/serve');

async function verify() {
  const server = createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const origin = 'http://127.0.0.1:' + server.address().port;
  let checks = 0;
  function request(route, method = 'GET') {
    return new Promise((resolve, reject) => {
      const req = http.request(origin + route, { method }, response => {
        const chunks = []; response.on('data', chunk => chunks.push(chunk)); response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks) }));
      });
      req.on('error', reject); req.end();
    });
  }
  try {
    for (const [route, page] of [['/', 'home'], ['/directory/?category=fsj&view=list', 'directory'], ['/profile/?id=arif-hasan', 'profile']]) {
      for (let refresh = 0; refresh < 2; refresh++) {
        const response = await request(route); assert.equal(response.status, 200); assert.match(response.headers['content-type'], /text\/html/); assert.ok(response.body.toString().includes('data-page="' + page + '"')); checks++;
      }
      const html = (await request(route)).body.toString();
      const base = new URL((html.match(/<base href="([^"]+)"/) || [])[1] || route, origin + route);
      for (const match of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"[^>]*>/g)) {
        const url = new URL(match[1], base); assert.equal(url.origin, origin);
        const asset = await request(url.pathname); assert.equal(asset.status, 200, 'Missing page asset'); assert.ok(asset.body.length); checks++;
      }
    }
    const suffix = '?category=fsj&view=list&q=F%C3%96J';
    for (const [source, destination] of [['/index.html','/'], ['/directory.html','/directory/'], ['/directory/index.html','/directory/'], ['/directory','/directory/'], ['/profile.html','/profile/'], ['/profile/index.html','/profile/'], ['/profile','/profile/']]) {
      const response = await request(source + suffix); assert.equal(response.status, 308); assert.equal(response.headers.location, destination + suffix); assert.equal((await request(response.headers.location)).status, 200); checks++;
    }
    for (const [route, type] of [['/css/main.css','text/css'], ['/js/routes.js','text/javascript'], ['/assets/fonts/SolaimanLipi.ttf','font/ttf'], ['/assets/fonts/poppins-400.woff2','font/woff2'], ['/assets/images/avatar-fallback.svg','image/svg+xml']]) {
      const response = await request(route); assert.equal(response.status, 200); assert.ok(response.headers['content-type'].startsWith(type)); checks++;
    }
    const head = await request('/directory/', 'HEAD'); assert.equal(head.status, 200); assert.equal(head.body.length, 0); assert.ok(Number(head.headers['content-length']) > 0); checks++;
    const method = await request('/directory/', 'POST'); assert.equal(method.status, 405); assert.equal(method.headers.allow, 'GET, HEAD'); checks++;
    for (const route of ['/missing/', '/README.md', '/scripts/serve.js', '/tests/verify.js', '/.git/config', '/data/people.example.js', '/assets/%2e%2e%2fREADME.md', '/assets/%5cREADME.md']) { assert.equal((await request(route)).status, 404); checks++; }
    assert.equal((await request('/assets/%ZZ')).status, 400); checks++;
    console.log(checks + ' HTTP route, redirect, refresh, and asset checks passed.');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

verify().catch(error => { console.error(error); process.exitCode = 1; });
