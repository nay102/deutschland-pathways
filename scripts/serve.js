/* A dependency-free local static server. Bind only to this computer. */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = fs.realpathSync(path.resolve(__dirname, '..'));
const pages = { '/': 'index.html', '/directory/': 'directory/index.html', '/profile/': 'profile/index.html' };
const redirects = { '/index.html': '/', '/directory': '/directory/', '/directory.html': '/directory/', '/directory/index.html': '/directory/', '/profile': '/profile/', '/profile.html': '/profile/', '/profile/index.html': '/profile/' };
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };

function createServer(options = {}) {
  const documentRoot = options.root ? fs.realpathSync(path.resolve(options.root)) : root;
  const basePath = options.basePath || '/';
  if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(basePath)) throw new Error('Invalid static website base path');
  return http.createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    response.setHeader('Referrer-Policy', 'no-referrer');
    function error(status, message) { response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end(request.method === 'HEAD' ? undefined : message); }
    const port = request.socket.localPort;
    if (!['127.0.0.1:' + port, 'localhost:' + port].includes(request.headers.host)) { error(421, 'Use the local website address'); return; }
    if (!['GET', 'HEAD'].includes(request.method)) { response.setHeader('Allow', 'GET, HEAD'); error(405, 'Method not allowed'); return; }
    let url; let pathname;
    try { url = new URL(request.url, 'http://127.0.0.1'); pathname = decodeURIComponent(url.pathname); } catch (_) { error(400, 'Invalid URL'); return; }
    if (/[\\\0]/.test(pathname) || pathname.split('/').some(part => part.startsWith('.'))) { error(404, 'Not found'); return; }
    if (basePath !== '/' && pathname === basePath.slice(0, -1)) { response.writeHead(308, { Location: basePath + url.search }); response.end(); return; }
    if (!pathname.startsWith(basePath)) { error(404, 'Not found'); return; }
    pathname = '/' + pathname.slice(basePath.length);
    if (Object.prototype.hasOwnProperty.call(redirects, pathname)) { response.writeHead(308, { Location: basePath.slice(0, -1) + redirects[pathname] + url.search }); response.end(); return; }
    // Expose application assets, never repository metadata, scripts, tests, or docs.
    const file = pages[pathname] || (/^\/(?:assets|css|js)\//.test(pathname) || ['/data/people.local.js','/data/people.public.js'].includes(pathname) ? pathname.slice(1) : null);
    if (!file || !mime[path.extname(file).toLowerCase()]) { error(404, 'Not found'); return; }
    const filename = path.resolve(documentRoot, file);
    if (!filename.startsWith(documentRoot + path.sep)) { error(404, 'Not found'); return; }
    try {
      const resolved = await fs.promises.realpath(filename);
      // Do not serve symlinks/junctions, even when their alias looks like an asset.
      const samePath = process.platform === 'win32' ? resolved.toLowerCase() === filename.toLowerCase() : resolved === filename;
      if (!samePath) { error(404, 'Not found'); return; }
      const stat = await fs.promises.stat(filename);
      if (!stat.isFile()) { error(404, 'Not found'); return; }
      response.writeHead(200, { 'Content-Type': mime[path.extname(file).toLowerCase()], 'Content-Length': stat.size });
      if (request.method === 'HEAD') response.end();
      else fs.createReadStream(filename).on('error', () => response.destroy()).pipe(response);
    } catch (_) { error(404, 'Not found'); }
  });
}

module.exports = { createServer };
if (require.main === module) {
  const args = process.argv.slice(2); let port = 4173; let rootDirectory; let basePath = '/'; let valid = true;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--root' && args[i + 1]) rootDirectory = args[++i];
    else if (args[i] === '--base' && args[i + 1]) basePath = args[++i];
    else if (i === 0 && /^[0-9]+$/.test(args[i])) port = Number(args[i]);
    else valid = false;
  }
  if (!valid || !Number.isInteger(port) || port < 1 || port > 65535) { console.error('Usage: node scripts/serve.js [PORT] [--root DIRECTORY] [--base /PROJECT/]'); process.exitCode = 1; }
  else {
    try {
      const server = createServer({ root: rootDirectory, basePath });
      server.on('error', error => { console.error('Could not start local website: ' + error.message); process.exitCode = 1; });
      server.listen(port, '127.0.0.1', () => console.log('Deutschland Pathways: http://127.0.0.1:' + port + basePath));
    } catch (_) { console.error('Could not open the requested static root or base path.'); process.exitCode = 1; }
  }
}
