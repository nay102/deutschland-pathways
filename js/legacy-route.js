/* Keep old bookmarks, including their filters, profile IDs, and anchors. */
(function () {
  'use strict';
  const page = document.body.dataset.redirect;
  if (!['directory', 'profile'].includes(page)) return;
  const target = page + (location.protocol === 'file:' ? '/index.html' : '/');
  location.replace(new URL(target + location.search + location.hash, location.href).href);
}());
