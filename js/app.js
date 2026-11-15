(function () {
  'use strict';
  window.DPReady = (window.DPLocalReady || Promise.resolve()).then(function () {
    const data = window.DPData; const route = window.DPRoutes.href;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const paths = {
      'arrow-right': '<path d="M4 12h16m-6-6 6 6-6 6"/>', 'arrow-left': '<path d="M20 12H4m6-6-6 6 6 6"/>', 'arrow-up-right': '<path d="M6 18 18 6M6 6h12v12"/>', 'arrow-down': '<path d="M12 4v16m-6-6 6 6 6-6"/>', 'chevron-right': '<path d="m9 5 7 7-7 7"/>',
      search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>', pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.3"/>', briefcase: '<rect x="3" y="7" width="18" height="14" rx="3"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12a24 24 0 0 0 18 0M12 11v4"/>', heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>', sprout: '<path d="M12 22v-9M12 16C3 17 2 9 2 9c8-1 10 3 10 7Zm0-3C12 5 21 3 21 3s2 9-9 10Z"/>', home: '<path d="m3 10 9-8 9 8M5 9v12h14V9M9 21v-8h6v8"/>',
      reset: '<path d="M3 11a9 9 0 1 1 2.5 7M3 4v7h7"/>', menu: '<path d="M4 8h16M4 16h16"/>', close: '<path d="m6 6 12 12M18 6 6 18"/>', facebook: '<path d="M14 21v-8h3l.5-4H14V7c0-1 .3-2 2-2h2V2h-3c-3 0-5 2-5 5v2H7v4h3v8"/>', calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 5h3"/>'
    };
    function el(tag, className, value) { const node = document.createElement(tag); if (className) node.className = className; if (value !== undefined && value !== null) node.textContent = String(value); return node; }
    function icon(name) { const span = el('span', 'icon'); span.setAttribute('aria-hidden', 'true'); span.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + (paths[name] || paths['arrow-right']) + '</svg>'; return span; }
    function fillIcons(root) { (root || document).querySelectorAll('[data-icon]').forEach(node => node.replaceChildren(icon(node.dataset.icon))); }
    function category(id) { return data.categories.find(c => c.id === id) || null; }
    function recordCategory(p) { return category(p.category) || { label: 'Pathway pending', subtitle: '', color: 'neutral' }; }
    function profiles() { return data.profiles.filter(p => (category(p.category) || !p.category) && p.inGermany === true); }
    function normalize(value) {
      // Fold Latin accents only: Bengali vowel signs and conjuncts must stay intact.
      return String(value || '').normalize('NFKC').toLocaleLowerCase('en')
        .replace(/[\u00c0-\u024f]/g, character => character.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
        .replace(/ß/g, 'ss').replace(/\bau[\s\-\u2010-\u2015]*pair\b/g, 'aupair')
        .replace(/\s+/g, ' ').trim();
    }
    function filterProfiles(state) {
      const words = normalize(state.q).split(' ').filter(Boolean);
      const result = profiles().filter(function (p) { const cat = recordCategory(p); const search = normalize([p.name, p.nameBn, p.city, cat.label, cat.subtitle, p.pathwayNote, p.specialization, p.facebookUrl].join(' ')); return words.every(word => search.includes(word)) && (!state.category || p.category === state.category) && (!state.city || p.city === state.city); });
      return result.sort(function (a, b) { if (state.sort === 'recent') return (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0) || a.name.localeCompare(b.name, 'en'); const comparison = a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }); return state.sort === 'name-desc' ? -comparison : comparison; });
    }
    function safeImage(source) { return typeof source === 'string' && /^(?:assets\/images|assets\/private)\/[a-zA-Z0-9_-]+\.(?:svg|png|jpe?g|webp|avif)$/i.test(source) ? source : 'assets/images/avatar-fallback.svg'; }
    function image(source, alt, className) { const img = el('img', className); img.src = safeImage(source); img.alt = alt; img.width = 400; img.height = 380; img.loading = 'lazy'; img.decoding = 'async'; img.addEventListener('error', function () { img.src = 'assets/images/avatar-fallback.svg'; img.alt = 'Image unavailable; neutral placeholder'; }, { once: true }); return img; }
    function portrait(p, className) { const alt = safeImage(p.image) === 'assets/images/avatar-fallback.svg' ? 'No profile image provided for ' + p.name + '; neutral placeholder' : (p.isDemo ? 'Fictional illustrated portrait of ' : 'Portrait of ') + p.name; return image(p.image, alt, className); }
    function portraitMark(p) { if (safeImage(p.image) !== 'assets/images/avatar-fallback.svg') return null; const words = p.name.replace(/\([^)]*\)/g, '').trim().split(/\s+/); const initials = [words[0], words.length > 1 ? words[words.length - 1] : ''].map(word => Array.from(word || '')[0] || '').join('').toLocaleUpperCase('en'); const mark = el('span', 'portrait-initials', initials); mark.setAttribute('aria-hidden', 'true'); return mark; }
    function facebookURL(p) { if (!p.facebookPermission || !p.facebookUrl) return null; try { const url = new URL(p.facebookUrl); return url.protocol === 'https:' && ['facebook.com', 'www.facebook.com', 'm.facebook.com'].includes(url.hostname) && !url.username && !url.password && !url.port ? url.href : null; } catch (_) { return null; } }
    function facebookLink(p, className) { const url = facebookURL(p); if (!url) return null; const link = el('a', className, 'Facebook'); link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.setAttribute('aria-label', p.name + ' on Facebook (opens in a new tab)'); link.append(icon('arrow-up-right')); return link; }
    let observer;
    function reveal(root) { const items = (root || document).querySelectorAll('.reveal:not(.is-visible)'); if (!('IntersectionObserver' in window) || motion.matches) { items.forEach(node => node.classList.add('is-visible')); return; } if (!observer) observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { threshold: .06 }); items.forEach((node, index) => { node.style.setProperty('--delay', Math.min(index % 4, 3) * 60 + 'ms'); observer.observe(node); }); }
    function profileCard(p, context, index) {
      const cat = recordCategory(p);
      const card = el('article', 'profile-card reveal tone-' + cat.color);
      const params = new URLSearchParams({ id: p.id }); if (context) params.set('from', context);
      const link = el('a', 'profile-card-main'); link.href = route('profile', '?' + params.toString());
      const visual = el('div', 'card-visual'); visual.append(portrait(p, 'card-portrait'));
      const mark = portraitMark(p); if (mark) visual.append(mark);
      if (p.isDemo) visual.append(el('span', 'portrait-demo', 'ILLUSTRATED DEMO'));
      const serial = el('span', 'card-serial', String(index + 1).padStart(2, '0')); serial.setAttribute('aria-hidden', 'true'); visual.append(serial);
      const badgeLabel = cat.label + (p.category === 'fsj' && normalize(p.pathwayNote) === 'foj' ? ' · FÖJ' : '');
      const body = el('div', 'card-body'); body.append(el('span', 'category-badge badge-' + cat.color, badgeLabel), el('h3', '', p.name));
      if (p.nameBn) { const bn = el('p', 'card-name-bn', p.nameBn); bn.lang = 'bn'; body.append(bn); }
      if (p.city) { const city = el('p', 'card-city'); city.append(icon('pin'), document.createTextNode(p.city + ', Germany')); body.append(city); }
      if (p.description || p.specialization || p.pathwayNote) body.append(el('p', 'card-description', p.description || p.specialization || 'Provided detail: ' + p.pathwayNote));
      const action = el('span', 'card-action', 'View profile'); const arrow = el('span', 'card-action-arrow'); arrow.append(icon('arrow-up-right')); action.append(arrow); body.append(action); link.append(visual, body); card.append(link);
      const facebook = facebookLink(p, 'card-facebook'); if (facebook) card.append(facebook);
      return card;
    }
    function renderCards(target, rows, context) { if (!target) return; if (observer) target.querySelectorAll('.reveal').forEach(node => observer.unobserve(node)); const fragment = document.createDocumentFragment(); rows.forEach((p, index) => fragment.append(profileCard(p, context, index))); target.replaceChildren(fragment); reveal(target); }
    function datasetText() { if (data.mode === 'public') return profiles().length ? profiles().length + ' public records' : 'No profiles approved for public display yet.'; if (data.mode === 'local') { const pending = profiles().filter(p => !p.category).length; return profiles().length + ' local records · Stored on this device.' + (pending ? ' ' + pending + ' need pathway details.' : ''); } if (data.mode === 'demo-fallback') return 'Local data could not be used. Showing ' + profiles().length + ' fictional demo profiles.'; return profiles().length + ' fictional profiles · Demonstration data only.'; }
    function shell() {
      const header = document.getElementById('site-header');
      // Static application-owned markup; profile and search data never enter innerHTML.
      header.innerHTML = '<header class="site-header"><div class="nav-inner container"><a class="brand" data-route="home" href="./" aria-label="Deutschland Pathways home"><img src="assets/icons/logo.svg" width="40" height="40" alt=""><span><strong>Deutschland Pathways<span>.</span></strong><small>BY RAFI’S SPRACHWELT</small></span></a><button class="menu-toggle icon-button" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="main-nav"><span data-icon="menu"></span></button><nav id="main-nav" class="main-nav" aria-label="Main navigation"><a data-nav="home" data-route="home" href="./">Home</a><a data-nav="directory" data-route="directory" href="directory/">Directory</a></nav></div></header>';
      const page = document.body.dataset.page;
      const active = header.querySelector('[data-nav="' + (page === 'profile' ? 'directory' : page) + '"]'); if (active) { active.classList.add('active'); if (page !== 'profile') active.setAttribute('aria-current', 'page'); }
      const footer = document.getElementById('site-footer');
      footer.innerHTML = '<footer class="site-footer"><div class="footer-inner container"><a class="footer-brand" data-route="home" href="./">Rafi’s Sprachwelt<span id="footer-dataset"></span></a><div class="footer-links"><a data-route="directory" href="directory/">Directory</a><a data-route="home" href="./#categories">Categories</a></div></div></footer>';
      document.getElementById('footer-dataset').textContent = page === 'home' ? 'PERSONAL DIRECTORY' : datasetText();
      document.querySelectorAll('[data-dataset-note]').forEach(node => { node.textContent = datasetText(); });
      const toggle = header.querySelector('.menu-toggle'); const nav = header.querySelector('nav');
      function close(focus) { toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Open navigation'); toggle.replaceChildren(icon('menu')); nav.classList.remove('is-open'); if (focus) toggle.focus(); }
      toggle.addEventListener('click', () => { const open = toggle.getAttribute('aria-expanded') !== 'true'; toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); toggle.replaceChildren(icon(open ? 'close' : 'menu')); nav.classList.toggle('is-open', open); });
      header.addEventListener('keydown', event => { if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') close(true); });
      nav.addEventListener('click', event => { if (event.target.closest('a')) close(false); });
      document.addEventListener('click', event => { if (!header.contains(event.target)) close(false); });
      header.addEventListener('focusout', () => setTimeout(() => { if (!header.contains(document.activeElement)) close(false); }, 0));
      window.matchMedia('(min-width: 821px)').addEventListener('change', () => close(false));
      const bar = header.querySelector('.site-header');
      let scrollQueued = false;
      window.addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(() => { bar.classList.toggle('is-scrolled', window.scrollY > 30); scrollQueued = false; }); } }, { passive: true });
      window.DPRoutes.updateLinks(header); window.DPRoutes.updateLinks(footer);
      fillIcons();
    }
    function home() {
      const grid = document.getElementById('pathway-grid'); if (!grid) return;
      data.categories.forEach(cat => { const link = el('a', 'category-card'); link.href = route('directory', '?category=' + cat.id); link.append(el('h3', '', cat.label), el('p', '', cat.subtitle + (cat.categoryNote ? ' · ' + cat.categoryNote : '')), icon('arrow-up-right')); grid.append(link); });
    }
    window.DP = { el, icon, fillIcons, category, recordCategory, profiles, normalize, filterProfiles, safeImage, image, portrait, portraitMark, facebookURL, facebookLink, renderCards, reveal, motion, datasetText };
    shell(); home(); reveal();
  });
}());
