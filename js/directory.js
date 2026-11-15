(function () {
  'use strict';
  window.DPPageReady = window.DPReady.then(function () {
    const app = window.DP; const data = window.DPData;
    const input = document.getElementById('directory-search'); const city = document.getElementById('city-filter'); const sort = document.getElementById('sort-filter'); const filters = document.getElementById('category-filters'); const results = document.getElementById('directory-results'); const empty = document.getElementById('empty-state'); const reset = document.getElementById('reset-filters'); const count = document.getElementById('result-count'); const clear = document.getElementById('clear-search'); const indicator = document.getElementById('active-filter-indicator'); const tabs = document.getElementById('category-tabs');
    const cities = Array.from(new Set(app.profiles().map(p => p.city).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    cities.forEach(name => { const option = app.el('option', '', name); option.value = name; city.append(option); });
    document.getElementById('total-profiles').textContent = app.profiles().length;
    document.getElementById('dataset-description').textContent = app.datasetText();
    document.getElementById('dataset-label').textContent = data.mode === 'public' ? 'PUBLIC DIRECTORY' : data.mode === 'local' ? 'LOCAL RECORDS' : 'DEMO COLLECTION';
    if (data.mode === 'public' && !app.profiles().length) { document.getElementById('empty-title').textContent = 'No public profiles yet.'; document.getElementById('empty-description').textContent = 'Profiles appear here after their information is approved for public display.'; }
    let state; let timer; let resultAnimation;
    const views = document.getElementById('view-controls');
    function readURL() { const p = new URLSearchParams(location.search); return { q: (p.get('q') || '').slice(0, 100), category: app.category(p.get('category')) ? p.get('category') : '', city: cities.includes(p.get('city')) ? p.get('city') : '', sort: ['name-asc', 'name-desc', 'recent'].includes(p.get('sort')) ? p.get('sort') : 'name-asc', view: ['list', 'icon', 'full'].includes(p.get('view')) ? p.get('view') : 'full' }; }
    function query() { const p = new URLSearchParams(); if (state.q) p.set('q', state.q); if (state.category) p.set('category', state.category); if (state.city) p.set('city', state.city); if (state.sort !== 'name-asc') p.set('sort', state.sort); if (state.view !== 'full') p.set('view', state.view); return p.toString(); }
    function moveIndicator() { const active = filters.querySelector('[aria-pressed="true"]'); if (!active) return; const box = active.getBoundingClientRect(); const parent = tabs.getBoundingClientRect(); indicator.style.width = box.width + 'px'; indicator.style.height = box.height + 'px'; indicator.style.transform = 'translate(' + (box.left - parent.left) + 'px,' + (box.top - parent.top) + 'px)'; }
    function render(updateURL, animate) {
      const rows = app.filterProfiles(state);
      input.value = state.q; city.value = state.city; sort.value = state.sort; clear.hidden = !state.q;
      filters.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === state.category)));
      views.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === state.view)));
      results.dataset.view = state.view;
      if (resultAnimation) resultAnimation.cancel();
      app.renderCards(results, rows, query()); empty.hidden = rows.length !== 0; results.hidden = rows.length === 0;
      count.replaceChildren(app.el('strong', '', rows.length), document.createTextNode(' of ' + app.profiles().length + ' people' + (state.category ? ' / ' + app.category(state.category).label : '') + (state.city ? ' / ' + state.city : '')));
      reset.disabled = !state.q && !state.category && !state.city && state.sort === 'name-asc';
      if (updateURL) { try { history.replaceState(null, '', location.pathname + (query() ? '?' + query() : '') + location.hash); } catch (_) { /* File History restrictions do not affect filtering. */ } }
      moveIndicator();
      if (animate && !app.motion.matches && results.animate) resultAnimation = results.animate([{ opacity: .35, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 300, easing: 'cubic-bezier(.2,.7,.2,1)' });
    }
    [{ id: '', label: 'All people' }].concat(data.categories).forEach(cat => { const button = app.el('button', 'filter-pill'); button.type = 'button'; button.dataset.category = cat.id; button.setAttribute('aria-pressed', 'false'); button.append(document.createTextNode(cat.label), app.el('span', 'filter-number', app.profiles().filter(p => !cat.id || p.category === cat.id).length)); button.addEventListener('click', () => { clearTimeout(timer); state.category = cat.id; state.q = input.value; render(true, true); }); filters.append(button); });
    function resetAll() { clearTimeout(timer); state = { q: '', category: '', city: '', sort: 'name-asc', view: state.view }; render(true, true); input.focus(); }
    views.querySelectorAll('button').forEach(button => button.addEventListener('click', () => { clearTimeout(timer); state.q = input.value; state.view = button.dataset.view; render(true, true); }));
    input.addEventListener('input', () => { clearTimeout(timer); clear.hidden = !input.value; timer = setTimeout(() => { state.q = input.value; render(true, true); }, 130); });
    document.getElementById('directory-search-form').addEventListener('submit', event => { event.preventDefault(); clearTimeout(timer); state.q = input.value; render(true, true); });
    clear.addEventListener('click', () => { clearTimeout(timer); state.q = ''; render(true, true); input.focus(); });
    city.addEventListener('change', () => { clearTimeout(timer); state.q = input.value; state.city = city.value; render(true, true); });
    sort.addEventListener('change', () => { clearTimeout(timer); state.q = input.value; state.sort = sort.value; render(true, true); });
    reset.addEventListener('click', resetAll); document.getElementById('empty-reset').addEventListener('click', resetAll);
    window.addEventListener('popstate', () => { clearTimeout(timer); state = readURL(); render(false, true); });
    if ('ResizeObserver' in window) new ResizeObserver(moveIndicator).observe(tabs); else window.addEventListener('resize', moveIndicator);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveIndicator);
    state = readURL(); render(false, false);
  });
}());
