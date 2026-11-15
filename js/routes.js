/* Folder routes work on ordinary static hosts, including subfolder installations. */
(function () {
  'use strict';
  const web = { home: './', directory: 'directory/', profile: 'profile/' };
  const files = { home: 'index.html', directory: 'directory/index.html', profile: 'profile/index.html' };
  function href(page, suffix) {
    const routes = location.protocol === 'file:' ? files : web;
    if (!Object.prototype.hasOwnProperty.call(routes, page)) throw new Error('Unknown page');
    return routes[page] + (suffix || '');
  }
  function updateLinks(root) {
    (root || document).querySelectorAll('[data-route]').forEach(link => {
      const match = (link.getAttribute('href') || '').match(/[?#].*$/);
      let suffix = match ? match[0] : '';
      if (link.getAttribute('data-current-page') !== null && suffix.startsWith('#')) suffix = location.search + suffix;
      link.setAttribute('href', href(link.dataset.route, suffix));
    });
  }
  // This path has a real directory index, so refresh and copied URLs remain valid.
  if (location.protocol !== 'file:' && /\/index\.html$/.test(location.pathname)) {
    try { history.replaceState(null, '', location.pathname.slice(0, -10) + location.search + location.hash); } catch (_) { /* Navigation still works when history is restricted. */ }
  }
  window.DPRoutes = { href, updateLinks };
  updateLinks();
}());
