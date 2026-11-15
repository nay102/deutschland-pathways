/* Dependency-free verification: node tests/verify.js
   The DOM test double is deliberately not a browser or visual layout engine. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pageFile = page => page === 'index' ? 'index.html' : page + '/index.html';
const routeFile = pathname => pathname.replace(/^\//, '') + (pathname.endsWith('/') ? 'index.html' : '');
let passed = 0;
async function check(name, fn) { await fn(); passed++; console.log('PASS ' + name); }
class Element {
  constructor(tag) {
    this.tagName = tag.toUpperCase(); this.children = []; this.attributes = {}; this.dataset = {}; this.events = {}; this.value = ''; this.hidden = false; this.className = ''; this._text = '';
    this.style = { setProperty(key, value) { this[key] = value; } };
    const owner = this;
    this.classList = { add(name) { const set = new Set(owner.className.split(' ').filter(Boolean)); set.add(name); owner.className = Array.from(set).join(' '); }, remove(name) { owner.className = owner.className.split(' ').filter(c => c !== name).join(' '); }, toggle(name, active) { if (active) this.add(name); else this.remove(name); } };
  }
  append(...nodes) { nodes.forEach(node => { if (node && node.tagName === 'FRAGMENT') this.append(...node.children); else { if (typeof node === 'string') node = { textContent: node }; if (node) { node.parent = this; this.children.push(node); } } }); }
  replaceChildren(...nodes) { this.children = []; this._text = ''; this.append(...nodes); }
  set textContent(value) { this._text = String(value); this.children = []; }
  get textContent() { return this._text + this.children.map(c => c.textContent || '').join(''); }
  set innerHTML(value) { this._html = value; this.children = []; parseHTML(value, this); }
  get innerHTML() { return this._html || ''; }
  setAttribute(key, value) { this.attributes[key] = String(value); if (key === 'class') this.className = value; if (key === 'value') this.value = value; if (key === 'hidden') this.hidden = true; if (key.startsWith('data-')) this.dataset[key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value; }
  getAttribute(key) { return this.attributes[key] ?? null; }
  addEventListener(type, fn) { (this.events[type] ||= []).push(fn); }
  fire(type, overrides = {}) { (this.events[type] || []).forEach(fn => fn(Object.assign({ target: this, preventDefault() {} }, overrides))); }
  focus() { this.focused = true; }
  contains(target) { return this === target || this.descendants().includes(target); }
  descendants() { return this.children.flatMap(c => c instanceof Element ? [c].concat(c.descendants()) : []); }
  querySelectorAll(selector) { return this.descendants().filter(node => matches(node, selector)); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  closest(selector) { return matches(this, selector) ? this : this.parent && this.parent.closest ? this.parent.closest(selector) : null; }
  getBoundingClientRect() { const position = this.parent ? this.parent.children.filter(c => c instanceof Element).indexOf(this) : 0; return { left: position * 100, top: 0, width: this.tagName === 'BUTTON' ? 96 : 560, height: this.tagName === 'BUTTON' ? 44 : 560 }; }
  animate() { this.animated = true; return { cancel() {} }; }
}
function matches(node, selector) {
  if (selector.startsWith('.reveal')) return node.className.split(' ').includes('reveal') && (!selector.includes(':not') || !node.className.split(' ').includes('is-visible'));
  if (selector.startsWith('.')) return node.className.split(' ').includes(selector.slice(1));
  const attribute = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/); if (attribute) return attribute[2] === undefined ? node.getAttribute(attribute[1]) !== null : node.getAttribute(attribute[1]) === attribute[2];
  return node.tagName === selector.toUpperCase();
}
const voidTags = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
function parseHTML(source, target, strict = false) {
  const stack = [target]; const clean = source.replace(/<!--[\s\S]*?-->/g, ''); const token = /<\/?[a-zA-Z][^>]*>|[^<]+/g; let match;
  while ((match = token.exec(clean))) {
    const part = match[0]; if (!part.startsWith('<')) { stack[stack.length - 1].append({ textContent: part }); continue; }
    const tag = part.match(/^<\/?([\w:-]+)/)[1].toLowerCase();
    if (part.startsWith('</')) { if (strict) assert.equal(stack[stack.length - 1].tagName, tag.toUpperCase(), 'Unbalanced HTML at ' + part); if (stack.length > 1) stack.pop(); continue; }
    const node = new Element(tag); for (const attr of part.matchAll(/([\w:-]+)(?:="([^"]*)")?/g)) { if (attr.index === 1) continue; node.setAttribute(attr[1], attr[2] || ''); }
    stack[stack.length - 1].append(node); if (!voidTags.has(tag) && !part.endsWith('/>')) stack.push(node);
  }
  if (strict) assert.equal(stack.length, 1, 'Unclosed HTML tags');
}
async function load(page, query = '', options = {}) {
  const activeRead = file => fs.readFileSync(path.join(options.root || root, file), 'utf8');
  const tree = new Element('document'); parseHTML(activeRead(pageFile(page)), tree);
  const document = { head: tree.querySelector('head'), body: tree.querySelector('body'), hidden: false, title: '', events: {}, createElement: tag => new Element(tag), createDocumentFragment: () => new Element('fragment'), createTextNode: text => ({ textContent: text }), getElementById: id => tree.descendants().find(node => node.getAttribute('id') === id) || null, querySelectorAll: selector => tree.querySelectorAll(selector), addEventListener(type, fn) { this.events[type] = fn; } };
  const windowEvents = {}; let pending;
  const sandbox = { document, URL, URLSearchParams, console, requestAnimationFrame() { return 1; }, cancelAnimationFrame() {}, setTimeout(fn) { pending = fn; return 1; }, clearTimeout() { pending = null; }, location: { protocol: options.protocol || 'https:', search: query, pathname: options.pathname || (page === 'index' ? '/' : '/' + page + '/'), hash: '' }, history: { replaceState(_a, _b, url) { sandbox.lastURL = url; } } };
  sandbox.window = { matchMedia: query => ({ matches: query.includes('prefers-reduced-motion') ? options.reducedMotion !== false : false, addEventListener() {} }), addEventListener(type, fn) { windowEvents[type] = fn; }, scrollY: 0 };
  vm.createContext(sandbox);
  document.head.append = script => {
    assert.equal(script.src, 'data/people.local.js');
    const deliver = () => { if (options.localError) script.onerror(); else { if (options.localFile) vm.runInContext(activeRead(script.src), sandbox); else sandbox.window.DP_LOCAL_PEOPLE = options.localRecords === undefined ? null : options.localRecords; script.onload(); } };
    if (options.deferLocal) Promise.resolve().then(deliver); else deliver();
  };
  for (const script of tree.querySelectorAll('script')) {
    const source = script.getAttribute('src'); if (!source) continue;
    vm.runInContext(activeRead(source), sandbox);
    if (['js/demo-data.js','js/public-data.js'].includes(source) && options.mutateData) options.mutateData(sandbox.window.DPData);
  }
  await (sandbox.window.DPPageReady || sandbox.window.DPReady);
  return { app: sandbox.window.DP, data: sandbox.window.DPData, tree, sandbox, document, byId: id => document.getElementById(id), events: windowEvents, flush() { if (pending) { const fn = pending; pending = null; fn(); } } };
}
function localRecord(overrides = {}) { return Object.assign({ id: 'example-person', name: 'Example Person', nameBn: 'উদাহরণ', category: 'ausbildung', city: 'Berlin', inGermany: true, isDemo: false, createdAt: '2025-02-02T00:00:00Z' }, overrides); }
function responsiveRules(width) {
  const css = read('css/responsive.css'); const rules = {};
  for (let index = 0; index < css.length;) {
    const start = css.indexOf('@media', index); if (start < 0) break;
    const open = css.indexOf('{', start); let depth = 1; let end = open + 1; for (; end < css.length && depth; end++) { if (css[end] === '{') depth++; if (css[end] === '}') depth--; }
    const query = css.slice(start, open); const widths = Array.from(query.matchAll(/(min|max)-width:\s*(\d+)px/g)); const active = widths.length && widths.every(m => m[1] === 'min' ? width >= Number(m[2]) : width <= Number(m[2]));
    if (active) for (const rule of css.slice(open + 1, end - 1).matchAll(/([^{}]+)\{([^{}]*)\}/g)) for (const selector of rule[1].trim().split(',')) { const declarations = rules[selector.trim()] ||= {}; for (const declaration of rule[2].split(';')) { const split = declaration.indexOf(':'); if (split >= 0) declarations[declaration.slice(0, split).trim()] = declaration.slice(split + 1).trim(); } }
    index = end;
  }
  return rules;
}
module.exports = { load };
if (require.main === module) (async function () {
  await check('JavaScript parses; no dependency/build setup exists', () => { for (const folder of ['js','scripts','tests']) for (const file of fs.readdirSync(path.join(root, folder)).filter(f => f.endsWith('.js'))) new vm.Script(read(folder + '/' + file), { filename: file }); assert.ok(!fs.existsSync(path.join(root, 'package.json'))); });
  await check('HTML nesting, landmarks, IDs, labels and local references', () => {
    for (const page of ['index','directory','profile']) {
      const html = read(pageFile(page)); const tree = new Element('document'); parseHTML(html, tree, true);
      assert.equal(tree.querySelectorAll('main').length, 1); assert.match(html, /<html lang="en">/); assert.match(html, /class="skip-link"/);
      const ids = Array.from(html.matchAll(/\bid="([^"]+)"/g), m => m[1]); assert.equal(new Set(ids).size, ids.length);
      const pageURL = new URL(page === 'index' ? '/' : '/' + page + '/', 'https://local.invalid');
      const baseURL = new URL(tree.querySelector('base')?.getAttribute('href') || pageURL, pageURL);
      for (const node of tree.descendants()) { if (node.tagName === 'BASE') continue; const ref = node.getAttribute('src') || node.getAttribute('href'); if (!ref) continue; const file = routeFile(new URL(ref, baseURL).pathname); assert.ok(fs.existsSync(path.join(root, file)), 'Missing ' + ref); }
      for (const m of html.matchAll(/<label[^>]*for="([^"]+)"/g)) assert.ok(ids.includes(m[1]));
      for (const m of html.matchAll(/<img\b[^>]*>/g)) assert.match(m[0], /\balt="[^"]*"/);
      for (const m of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(m[1]));
    }
  });
  await check('Clean routes preserve subfolder hosting, file compatibility, skip links and explicit index URLs', async () => {
    for (const page of ['index','directory','profile']) {
      const query = page === 'directory' ? '?category=fsj&view=list' : page === 'profile' ? '?id=arif-hasan' : '';
      const d = await load(page, query); const paths = d.sandbox.window.DPRoutes;
      for (const prefix of ['/', '/personal/pathways/']) {
        const current = new URL(prefix + (page === 'index' ? '' : page + '/') + query, 'https://local.invalid');
        const base = new URL(d.tree.querySelector('base')?.getAttribute('href') || current, current);
        assert.equal(new URL(paths.href('home'), base).pathname, prefix);
        assert.equal(new URL(paths.href('directory'), base).pathname, prefix + 'directory/');
        assert.equal(new URL(paths.href('profile', '?id=arif-hasan'), base).pathname, prefix + 'profile/');
        const skip = new URL(d.tree.querySelector('.skip-link').getAttribute('href'), base);
        assert.equal(skip.pathname, current.pathname); assert.equal(skip.search, query); assert.equal(skip.hash, '#main');
      }
      for (const link of d.tree.querySelectorAll('a')) assert.ok(!(link.href || link.getAttribute('href') || '').split('?')[0].includes('.html'));
      const local = await load(page, query, { protocol: 'file:' });
      assert.equal(local.sandbox.window.DPRoutes.href('directory'), 'directory/index.html');
      const skip = local.tree.querySelector('.skip-link').getAttribute('href');
      if (page !== 'index') assert.equal(skip, page + '/index.html' + query + '#main');
      const canonical = await load(page, query, { pathname: '/personal/pathways/' + pageFile(page) });
      assert.equal(canonical.sandbox.lastURL, '/personal/pathways/' + (page === 'index' ? '' : page + '/') + query);
    }
  });
  await check('Legacy bookmarks redirect with profile IDs, filters, view, and fragments intact', () => {
    for (const page of ['directory','profile']) for (const protocol of ['https:','file:']) {
      const query = '?id=example-person&category=fsj&view=list'; const origin = protocol === 'file:' ? 'file:///C:/personal/pathways/' : 'https://local.invalid/personal/pathways/';
      let destination; const context = { document: { body: { dataset: { redirect: page } } }, URL, location: { protocol, href: origin + page + '.html' + query, search: query, hash: '#main', replace(value) { destination = value; } } };
      vm.runInNewContext(read('js/legacy-route.js'), context);
      assert.equal(destination, origin + page + (protocol === 'file:' ? '/index.html' : '/') + query + '#main');
    }
  });
  await check('CSS delimiters and reduced-motion support', () => { for (const file of fs.readdirSync(path.join(root, 'css'))) { const css = read('css/' + file).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(['"])(?:\\.|(?!\1).)*\1/g, ''); const stack = []; for (const char of css) { if ('{('.includes(char)) stack.push(char); if (char === '}') assert.equal(stack.pop(), '{', file); if (char === ')') assert.equal(stack.pop(), '(', file); } assert.equal(stack.length, 0); } assert.match(read('css/animations.css'), /prefers-reduced-motion: reduce/); });
  await check('Responsive directory and category grids at 360, 390, 768, 1024, 1440px (structural, not visual)', () => { for (const width of [360,390,768,1024,1440]) { const rules = responsiveRules(width); const grid = rules['.profile-grid']?.['grid-template-columns']; if (width <= 600) assert.equal(grid, '1fr'); else if (width <= 820) assert.match(grid, /repeat\(2/); else assert.equal(grid, undefined); if (width <= 600) { assert.match(rules['.category-grid']['grid-template-columns'], /repeat\(2/); assert.equal(rules['.filter-pill']['min-height'], '44px'); } } assert.match(read('css/components.css'), /grid-template-columns: repeat\(4/); });
  const home = await load('index');
  await check('20 fictional people already in Germany, exactly five per approved pathway', () => { assert.equal(home.data.profiles.length, 20); assert.equal(home.data.categories.map(c => c.label).join(','), 'Ausbildung,FSJ,BFD,Au-pair'); assert.equal(new Set(home.data.profiles.map(p => p.id)).size, 20); for (const c of home.data.categories) assert.equal(home.data.profiles.filter(p => p.category === c.id).length, 5); for (const p of home.data.profiles) { assert.equal(p.inGermany, true); assert.equal(p.isDemo, true); assert.equal(p.facebookUrl, ''); assert.ok(fs.existsSync(path.join(root, p.image))); } });
  await check('Home shows four working categories and no people, previews or search forms', () => { assert.equal(home.byId('pathway-grid').children.length, 4); assert.equal(home.byId('featured-profiles'), null); assert.equal(home.byId('hero-profiles'), null); assert.equal(home.byId('main').querySelectorAll('article').length, 0); assert.equal(home.byId('main').querySelectorAll('form').length, 0); for (const cat of home.data.categories) assert.ok(home.byId('pathway-grid').children.some(link => link.href === 'directory/?category=' + cat.id)); });
  await check('All English and Bengali names are searchable; case and spaces normalize', () => { for (const p of home.data.profiles) for (const name of [p.name, p.nameBn]) assert.equal(home.app.filterProfiles({ q: name })[0].id, p.id); assert.equal(home.app.filterProfiles({ q: '  ARIF   HASAN ' })[0].id, 'arif-hasan'); });
  await check('Search matches pathway, city, and combined terms', () => { assert.equal(home.app.filterProfiles({ q: 'ausbildung' }).length, 5); assert.ok(home.app.filterProfiles({ q: 'berlin' }).every(p => p.city === 'Berlin')); assert.equal(home.app.filterProfiles({ q: 'Berlin Ausbildung' })[0].id, 'arif-hasan'); assert.equal(home.app.filterProfiles({ q: 'voluntary social year' }).length, 5); assert.equal(home.app.filterProfiles({ q: '<img src=x>' }).length, 0); });
  await check('FÖJ/FOJ and Au-pair spelling variants find the right pathways without changing Bengali text', async () => {
    const rows = [localRecord({ category: 'fsj', pathwayNote: 'FÖJ' }), localRecord({ id: 'social-example', category: 'fsj', name: 'Social Example' }), localRecord({ id: 'pair-example', category: 'au-pair', name: 'Pair Example' }), localRecord({ id: 'service-example', category: 'bfd', name: 'Service Example' })];
    const d = await load('directory', '', { localRecords: rows, deferLocal: true });
    for (const q of ['FÖJ','föj','FOJ','foj']) assert.equal(d.app.filterProfiles({ q }).map(p => p.id).join(','), 'example-person');
    for (const q of ['au pair','Au-pair','aupair','AU PAIR','au–pair','au‑pair']) assert.equal(d.app.filterProfiles({ q }).map(p => p.id).join(','), 'pair-example');
    assert.equal(d.app.filterProfiles({ q: 'BFD' })[0].id, 'service-example');
    assert.equal(d.app.normalize('বাংলা অক্ষর'), 'বাংলা অক্ষর');
    assert.equal(d.app.filterProfiles({ q: 'উদাহরণ' }).length, rows.length);
    assert.ok(home.byId('pathway-grid').children.find(link => link.href.endsWith('category=fsj')).textContent.includes('Includes FÖJ'));
    for (const view of ['list','icon','full']) {
      const result = await load('directory', '?category=fsj&view=' + view, { localRecords: rows });
      const badge = result.byId('directory-results').querySelectorAll('.category-badge').find(b => b.textContent.includes('FÖJ'));
      assert.equal(badge.textContent, 'FSJ · FÖJ');
    }
  });
  await check('Every category/city combination matches the underlying records', () => { const cities = new Set(home.data.profiles.map(p => p.city)); for (const c of home.data.categories) for (const city of cities) { const expected = home.data.profiles.filter(p => p.category === c.id && p.city === city).map(p => p.id).sort().join(','); assert.equal(home.app.filterProfiles({ category: c.id, city }).map(p => p.id).sort().join(','), expected); } });
  await check('Name A–Z, Z–A, and recently-added sorting', () => { for (const sort of ['name-asc','name-desc','recent']) { const rows = home.app.filterProfiles({ sort }); for (let i = 1; i < rows.length; i++) if (sort === 'recent') assert.ok(Date.parse(rows[i - 1].createdAt) >= Date.parse(rows[i].createdAt)); else { const difference = rows[i - 1].name.localeCompare(rows[i].name, 'en', { sensitivity: 'base' }); assert.ok(sort === 'name-desc' ? difference >= 0 : difference <= 0); } } });
  await check('Directory query state, live counts, active tab and reset', async () => { const d = await load('directory', '?q=Arif&category=ausbildung&city=Berlin&sort=recent'); assert.equal(d.byId('directory-results').children.length, 1); assert.equal(d.byId('directory-search').value, 'Arif'); assert.equal(d.byId('city-filter').value, 'Berlin'); assert.match(d.byId('result-count').textContent, /^1 of 20/); assert.equal(d.byId('category-filters').querySelector('[aria-pressed="true"]').dataset.category, 'ausbildung'); d.byId('reset-filters').fire('click'); assert.equal(d.byId('directory-results').children.length, 20); assert.equal(d.byId('reset-filters').disabled, true); });
  await check('Search, category, city, clear and empty-state controls compose correctly', async () => { const d = await load('directory'); const input = d.byId('directory-search'); input.value = 'নুসরাত'; input.fire('input'); d.flush(); assert.equal(d.byId('directory-results').children.length, 1); d.byId('category-filters').children.find(b => b.dataset.category === 'bfd').fire('click'); assert.equal(d.byId('empty-state').hidden, false); assert.equal(d.byId('directory-results').hidden, true); d.byId('empty-reset').fire('click'); d.byId('city-filter').value = 'Berlin'; d.byId('city-filter').fire('change'); assert.equal(d.byId('directory-results').children.length, 3); input.value = 'Arif'; input.fire('input'); d.flush(); d.byId('clear-search').fire('click'); assert.equal(d.byId('city-filter').value, 'Berlin'); assert.equal(d.byId('directory-results').children.length, 3); d.byId('sort-filter').value = 'name-desc'; d.byId('sort-filter').fire('change'); assert.match(d.sandbox.lastURL, /city=Berlin&sort=name-desc/); });
  await check('Unknown URL filters fall back safely; browser popstate refreshes results', async () => { const d = await load('directory', '?category=invalid&city=unknown&sort=invalid'); assert.equal(d.byId('directory-results').children.length, 20); d.sandbox.location.search = '?category=fsj'; d.events.popstate(); assert.equal(d.byId('directory-results').children.length, 5); });
  await check('File-history restrictions do not break filtering', async () => { const d = await load('directory'); d.sandbox.history.replaceState = () => { throw new Error('file history disabled'); }; d.byId('category-filters').children.find(b => b.dataset.category === 'au-pair').fire('click'); assert.equal(d.byId('directory-results').children.length, 5); });
  await check('Search submit, native clear, filter counts, and URL encoding keep all controls synchronized', async () => {
    const d = await load('directory'); const input = d.byId('directory-search');
    input.value = 'Arif'; input.fire('input'); d.byId('directory-search-form').fire('submit');
    assert.equal(d.byId('directory-results').children.length, 1); assert.match(d.sandbox.lastURL, /q=Arif/);
    input.value = ''; input.fire('input'); d.flush(); assert.equal(d.byId('directory-results').children.length, 20); assert.equal(d.byId('clear-search').hidden, true);
    for (const button of d.byId('category-filters').children) { button.fire('click'); const expected = d.app.filterProfiles({ category: button.dataset.category }); assert.equal(d.byId('directory-results').children.length, expected.length); assert.equal(Number(button.querySelector('.filter-number').textContent), expected.length); assert.equal(button.getAttribute('aria-pressed'), 'true'); }
    d.byId('reset-filters').fire('click'); input.value = 'নুসরাত'; d.byId('directory-search-form').fire('submit');
    assert.equal(new URLSearchParams(d.sandbox.lastURL.split('?')[1]).get('q'), 'নুসরাত'); assert.equal(d.byId('directory-results').children.length, 1);
    assert.equal(d.byId('sort-filter').querySelectorAll('option').length, 3);
    assert.ok(d.byId('city-filter').querySelectorAll('option').some(option => option.value === 'Berlin'));
  });
  await check('List, Icon and Full views preserve results, filters, sorting and profile return links', async () => {
    for (const category of home.data.categories) for (const view of ['list','icon','full']) {
      const d = await load('directory', '?category=' + category.id + '&sort=name-desc&view=' + view);
      assert.equal(d.byId('directory-results').dataset.view, view);
      assert.equal(d.byId('view-controls').querySelectorAll('[aria-pressed="true"]').length, 1);
      assert.equal(d.byId('view-controls').querySelector('[aria-pressed="true"]').dataset.view, view);
      assert.equal(d.byId('directory-results').children.length, 5);
      const link = d.byId('directory-results').querySelector('.profile-card-main');
      const params = new URLSearchParams(link.href.split('?')[1]);
      const profile = await load('profile', '?' + params);
      const back = new URLSearchParams(profile.byId('back-to-directory').href.split('?')[1]);
      assert.equal(back.get('category'), category.id); assert.equal(back.get('sort'), 'name-desc');
      assert.equal(back.get('view'), view === 'full' ? null : view);
    }
    const d = await load('directory', '?view=unsupported');
    assert.equal(d.byId('directory-results').dataset.view, 'full');
    const original = d.byId('directory-results').querySelectorAll('.profile-card-main').map(link => new URLSearchParams(link.href.split('?')[1]).get('id')).join(',');
    const input = d.byId('directory-search'); input.value = 'Arif'; input.fire('input');
    d.byId('view-controls').querySelectorAll('button').find(button => button.dataset.view === 'list').fire('click');
    assert.match(d.sandbox.lastURL, /q=Arif&view=list/); assert.equal(d.byId('directory-results').children.length, 1);
    d.byId('reset-filters').fire('click');
    assert.equal(d.sandbox.lastURL, '/directory/?view=list');
    assert.equal(d.byId('directory-results').dataset.view, 'list');
    assert.equal(d.byId('directory-results').querySelectorAll('.profile-card-main').map(link => new URLSearchParams(link.href.split('?')[1]).get('id')).join(','), original);
    d.sandbox.location.search = '?view=icon&category=bfd'; d.events.popstate();
    assert.equal(d.byId('directory-results').dataset.view, 'icon'); assert.equal(d.byId('directory-results').children.length, 5);
    d.byId('view-controls').querySelectorAll('button').find(button => button.dataset.view === 'full').fire('click');
    assert.equal(d.byId('directory-results').dataset.view, 'full'); assert.ok(!d.sandbox.lastURL.includes('view='));
  });
  await check('Compact views keep optional Facebook links usable and empty states recover in the selected view', async () => {
    const options = { localRecords: [localRecord({ facebookUrl: 'https://www.facebook.com/example', facebookPermission: true })] };
    for (const view of ['list','icon','full']) {
      const d = await load('directory', '?view=' + view, options);
      assert.equal(d.byId('directory-results').querySelectorAll('.profile-card-main').length, 1);
      assert.equal(d.byId('directory-results').querySelector('.card-facebook').href, 'https://www.facebook.com/example');
      d.byId('directory-search').value = 'No matching person'; d.byId('directory-search').fire('input'); d.flush();
      assert.equal(d.byId('empty-state').hidden, false);
      d.byId('empty-reset').fire('click'); assert.equal(d.byId('empty-state').hidden, true);
      assert.equal(d.byId('directory-results').dataset.view, view); assert.equal(d.byId('directory-results').children.length, 1);
    }
  });
  await check('All 20 detail routes render correct names, arrival years and no fabricated Facebook link', async () => { for (const p of home.data.profiles) { const profile = await load('profile', '?id=' + p.id); assert.equal(profile.document.title, p.name + ' — Deutschland Pathways'); assert.ok(profile.byId('profile-content').textContent.includes(p.nameBn)); assert.ok(profile.byId('profile-content').textContent.includes('In Germany since ' + p.arrivalYear)); assert.ok(!profile.byId('profile-content').descendants().some(node => node.href && node.href.includes('facebook'))); } });
  await check('Optional demo gallery, related records and back context work', async () => { const p = await load('profile', '?id=arif-hasan&from=' + encodeURIComponent('category=ausbildung&city=Berlin&sort=recent&extra=discard')); assert.equal(p.byId('profile-content').querySelectorAll('.gallery-image').length, 2); assert.equal(p.byId('related-profiles').children.length, 3); assert.equal(p.byId('back-to-directory').href, 'directory/?category=ausbildung&city=Berlin&sort=recent'); });
  await check('Missing, empty and hostile profile IDs render a useful not-found state', async () => { for (const query of ['', '?id=unknown', '?id=%3Cscript%3Ealert(1)%3C/script%3E']) { const p = await load('profile', query); assert.match(p.byId('profile-content').textContent, /isn’t in the directory/); assert.equal(p.document.title, 'Profile not found — Deutschland Pathways'); } });
  await check('Missing optional local fields hide cleanly and image uses fallback', async () => { const p = await load('profile', '?id=example-person', { localRecords: [localRecord()] }); assert.ok(!p.byId('profile-content').textContent.includes('Arrival year')); assert.ok(!p.byId('profile-content').textContent.includes('Specialization')); assert.equal(p.byId('profile-content').querySelector('.profile-large-portrait').src, 'assets/images/avatar-fallback.svg'); assert.equal(p.byId('profile-content').querySelector('.profile-story'), null); });
  await check('Specialization only appears for Ausbildung; invalid years hide', async () => { const p = await load('profile', '?id=example-person', { localRecords: [localRecord({ category: 'fsj', arrivalYear: 9999, specialization: 'Hidden field' })] }); assert.ok(!p.byId('profile-content').textContent.includes('Hidden field')); assert.ok(!p.byId('profile-content').textContent.includes('Arrival year')); });
  await check('Local records replace demos and carry an honest dataset label', async () => { const d = await load('directory', '', { localRecords: [localRecord()] }); assert.equal(d.data.mode, 'local'); assert.equal(d.byId('directory-results').children.length, 1); assert.equal(d.byId('total-profiles').textContent, '1'); assert.equal(d.byId('dataset-label').textContent, 'LOCAL RECORDS'); assert.ok(!d.byId('directory-results').textContent.includes('ILLUSTRATED DEMO')); });
  await check('Absent/null local data safely falls back to demonstrations', async () => { for (const options of [{ localError: true }, { localRecords: null }]) { const d = await load('directory', '', options); assert.equal(d.data.mode, 'demo'); assert.equal(d.byId('directory-results').children.length, 20); assert.match(d.byId('dataset-description').textContent, /fictional/); } });
  await check('Invalid, duplicate, unsupported or not-yet-arrived local records use labelled fallback', async () => { for (const rows of [[localRecord({ category: 'invalid' })], [localRecord({ inGermany: false })], [localRecord(), localRecord()], [localRecord({ name: '' })], [localRecord({ id: '../unsafe' })], { not: 'an array' }]) { const d = await load('directory', '', { localRecords: rows }); assert.equal(d.data.mode, 'demo-fallback'); assert.match(d.byId('dataset-description').textContent, /could not be used/); } });
  await check('An empty collection keeps all homepage category links available', async () => { const d = await load('directory', '', { localRecords: [] }); assert.equal(d.data.mode, 'local'); assert.equal(d.byId('directory-results').hidden, true); assert.equal(d.byId('empty-state').hidden, false); const h = await load('index', '', { localRecords: [] }); assert.equal(h.byId('pathway-grid').children.length, 4); });
  await check('Unspecified pathways remain visible without inventing categories or losing supplied notes', async () => { const rows = [localRecord({ category: '', pathwayNote: 'FÖJ', city: '' }), localRecord({ id: 'second-example', category: '', pathwayNote: 'Pflege' })]; const d = await load('directory', '', { localRecords: rows }); assert.equal(d.data.mode, 'local'); assert.equal(d.byId('directory-results').children.length, 2); assert.equal(d.byId('category-filters').children.length, 5); assert.match(d.byId('dataset-description').textContent, /2 need pathway details/); assert.equal(d.app.filterProfiles({ q: 'FÖJ' }).length, 1); assert.equal(d.app.filterProfiles({ category: 'fsj' }).length, 0); const p = await load('profile', '?id=example-person', { localRecords: rows }); assert.match(p.byId('profile-content').textContent, /Pathway pending/); assert.match(p.byId('profile-content').textContent, /FÖJ/); assert.equal(p.byId('related-section').hidden, true); const h = await load('index', '', { localRecords: rows }); assert.equal(h.byId('pathway-grid').children.length, 4); assert.equal(h.byId('main').querySelectorAll('article').length, 0); });
  await check('A 60-record local collection renders and computes category counts dynamically', async () => { const categories = ['ausbildung','fsj','bfd','au-pair']; const rows = Array.from({ length: 60 }, (_, index) => localRecord({ id: 'example-' + index, name: 'Example ' + String(index).padStart(2, '0'), category: categories[index % 4] })); const d = await load('directory', '', { localRecords: rows }); assert.equal(d.byId('directory-results').children.length, 60); assert.equal(d.byId('total-profiles').textContent, '60'); d.byId('category-filters').children.find(b => b.dataset.category === 'fsj').fire('click'); assert.equal(d.byId('directory-results').children.length, 15); assert.match(d.byId('result-count').textContent, /^15 of 60/); });
  await check('Reference-theme text tokens meet 4.5:1 contrast on lavender and white surfaces', () => {
    function luminance(hex) { const channels = hex.replace('#','').match(/\w\w/g).map(c => parseInt(c,16) / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4); return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722; }
    const source = read('css/main.css'); const tokens = Object.fromEntries(Array.from(source.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})(?=[;\s])/gi), m => [m[1],m[2]]));
    assert.match(source, /color-scheme:\s*light/);
    const pairs = []; for (const background of [tokens.bg, tokens.surface, tokens['surface-raised'], '#c0d3f1']) for (const foreground of [tokens.ink, tokens.muted, tokens.emerald]) pairs.push([foreground, background]);
    for (const selector of ['card-city','card-name-bn']) { const color = read('css/components.css').match(new RegExp('\\.' + selector + '\\s*\\{[^}]*\\bcolor:\\s*(#[0-9a-f]{6})','i'))[1]; pairs.push([color, '#c0d3f1']); }
    pairs.push(['#ffffff','#5b21b6'], ['#ffffff','#2563eb']);
    for (const [foreground, background] of pairs) { const values = [luminance(foreground), luminance(background)].sort((a,b) => b - a); assert.ok((values[0] + .05) / (values[1] + .05) >= 4.5, foreground + ' on ' + background); }
  });
  await check('Archived font binaries retain valid variable-font tables and licenses', () => {
    for (const family of ['Sora','Manrope']) { const bytes = fs.readFileSync(path.join(root,'assets/fonts/' + family + '-Variable.ttf')); assert.equal(bytes.readUInt32BE(0), 0x00010000); const tables = {}; for (let i = 0; i < bytes.readUInt16BE(4); i++) { const position = 12 + i * 16; tables[bytes.toString('ascii',position,position + 4)] = { offset: bytes.readUInt32BE(position + 8), length: bytes.readUInt32BE(position + 12) }; } assert.ok(tables.fvar && tables.name); const name = tables.name.offset; const strings = name + bytes.readUInt16BE(name + 4); const names = []; for (let i = 0; i < bytes.readUInt16BE(name + 2); i++) { const position = name + 6 + i * 12; if (bytes.readUInt16BE(position) !== 3 || bytes.readUInt16BE(position + 6) !== 1) continue; const length = bytes.readUInt16BE(position + 8); const start = strings + bytes.readUInt16BE(position + 10); names.push(Buffer.from(bytes.subarray(start,start + length)).swap16().toString('utf16le')); } assert.ok(names.some(name => name.includes(family))); assert.match(read('assets/fonts/' + family + '-OFL.txt'), /SIL Open Font License/); }
  });
  await check('User-supplied names, descriptions and bios are literal text, never HTML', async () => { const payload = '<img src=x onerror=alert(1)>'; const p = await load('profile', '?id=example-person', { localRecords: [localRecord({ name: payload, description: payload, bio: payload })] }); assert.ok(p.byId('profile-content').textContent.includes(payload)); assert.ok(p.byId('profile-content').descendants().filter(node => node._html).every(node => node._html.startsWith('<svg '))); assert.ok(!p.byId('profile-content').descendants().some(node => node.getAttribute('onerror'))); });
  await check('Images reject external URLs, traversal and unsafe formats; errors get local fallback', async () => { for (const source of ['https://example.invalid/tracker.jpg', '../private.jpg', 'assets/private/../secret.jpg', 'data:image/svg+xml,x', 'assets/private/image.html']) assert.equal(home.app.safeImage(source), 'assets/images/avatar-fallback.svg'); assert.equal(home.app.safeImage('assets/private/portrait-01.jpg'), 'assets/private/portrait-01.jpg'); const img = home.app.portrait(localRecord({ image: 'assets/private/missing.jpg' }), 'portrait'); img.fire('error'); assert.equal(img.src, 'assets/images/avatar-fallback.svg'); });
  await check('Facebook approval and exact HTTPS host checks protect both cards and profiles', async () => { for (const url of ['javascript:alert(1)','http://facebook.com/example','https://facebook.com.evil.invalid/example','https://user:pass@facebook.com/example','https://facebook.com:9000/example']) assert.equal(home.app.facebookURL({ facebookUrl: url, facebookPermission: true }), null); const url = 'https://www.facebook.com/example'; assert.equal(home.app.facebookURL({ facebookUrl: url, facebookPermission: false }), null); const records = [localRecord({ facebookUrl: url, facebookPermission: true })]; const d = await load('directory', '', { localRecords: records }); const link = d.byId('directory-results').querySelector('.card-facebook'); assert.equal(link.href, url); assert.equal(link.rel, 'noopener noreferrer'); const p = await load('profile', '?id=example-person', { localRecords: records }); assert.equal(p.byId('profile-content').querySelector('.profile-facebook').href, url); });
  await check('Missing createdAt sorts after valid dates', async () => { const d = await load('directory', '?sort=recent', { localRecords: [localRecord({ id: 'undated', name: 'A person', createdAt: '' }), localRecord({ id: 'dated', name: 'Z person' })] }); assert.equal(d.app.filterProfiles({ sort: 'recent' })[0].id, 'dated'); });
  await check('Mobile navigation event handlers open, Escape-close, and return focus', () => { const toggle = home.tree.querySelector('.menu-toggle'); toggle.fire('click'); assert.equal(toggle.getAttribute('aria-expanded'), 'true'); assert.ok(home.tree.querySelector('.main-nav').className.includes('is-open')); home.byId('site-header').fire('keydown', { key: 'Escape' }); assert.equal(toggle.getAttribute('aria-expanded'), 'false'); assert.equal(toggle.focused, true); });
  await check('Every page has working navigation targets and mobile menus close on toggle, link, and outside click', async () => {
    for (const page of ['index','directory','profile']) {
      const d = await load(page, page === 'profile' ? '?id=arif-hasan' : ''); const nav = d.tree.querySelector('.main-nav'); const toggle = d.tree.querySelector('.menu-toggle');
      assert.equal(nav.querySelector('.active').getAttribute('href'), page === 'index' ? './' : 'directory/');
      toggle.fire('click'); toggle.fire('click'); assert.equal(toggle.getAttribute('aria-expanded'), 'false');
      toggle.fire('click'); nav.fire('click', { target: nav.querySelector('a') }); assert.equal(toggle.getAttribute('aria-expanded'), 'false');
      toggle.fire('click'); d.document.events.click({ target: d.byId('main') }); assert.equal(toggle.getAttribute('aria-expanded'), 'false');
      for (const link of d.tree.querySelectorAll('a')) { const href = link.href || link.getAttribute('href'); if (!href || /^https?:/.test(href)) continue; const target = new URL(href, 'https://local.invalid/'); const file = routeFile(target.pathname); assert.ok(fs.existsSync(path.join(root, file))); if (target.hash) assert.match(read(file), new RegExp('id="' + target.hash.slice(1) + '"')); }
    }
    for (const file of fs.readdirSync(path.join(root, 'css'))) for (const match of read('css/' + file).matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)) assert.ok(fs.existsSync(path.resolve(root, 'css', match[1])), 'Missing CSS asset');
  });
  await check('Reduced-motion mode does not run the result animation', async () => { const d = await load('directory'); d.byId('category-filters').children[1].fire('click'); assert.ok(!d.byId('directory-results').animated); const moving = await load('directory', '', { reducedMotion: false }); moving.byId('category-filters').children[1].fire('click'); assert.equal(moving.byId('directory-results').animated, true); });
  await check('Private-data rules, no network-required functionality or browser storage', () => { const ignore = read('.gitignore'); assert.match(ignore, /\/data\/people\.local\.js/); assert.match(ignore, /\/assets\/private\//); for (const file of fs.readdirSync(path.join(root, 'js'))) assert.doesNotMatch(read('js/' + file), /\bfetch\s*\(|\bimport\s|localStorage|XMLHttpRequest/); for (const file of fs.readdirSync(path.join(root, 'css'))) assert.doesNotMatch(read('css/' + file), /@import|url\(https?:/); });
  if (process.argv.includes('--local')) {
    await check('Ignored local import: all records, searches, profile routes and approved Facebook actions', async () => {
      const local = { window: {} }; vm.runInNewContext(read('data/people.local.js'), local);
      const rows = local.window.DP_LOCAL_PEOPLE; assert.ok(Array.isArray(rows) && rows.length > 0);
      const d = await load('directory', '', { localFile: true, deferLocal: true }); assert.equal(d.data.mode, 'local'); assert.equal(d.byId('directory-results').children.length, rows.length);
      assert.equal(d.byId('directory-results').querySelectorAll('.card-facebook').length, rows.length);
      for (const person of rows) { assert.equal(d.app.filterProfiles({ q: person.name })[0].id, person.id); const p = await load('profile', '?id=' + encodeURIComponent(person.id), { localFile: true, deferLocal: true }); assert.equal(p.byId('profile-breadcrumb').textContent, person.name); assert.equal(p.byId('profile-content').querySelector('.profile-facebook').href, new URL(person.facebookUrl).href); assert.equal(p.byId('profile-content').querySelector('.category-badge').textContent, d.app.recordCategory(person).label); if (person.pathwayNote) assert.ok(p.byId('profile-content').textContent.includes(person.pathwayNote)); assert.ok(!p.byId('profile-content').textContent.includes('Fictional person')); }
      const sourceFiles = ['README.md','index.html','directory/index.html','profile/index.html','directory.html','profile.html','data/people.example.js'].concat(fs.readdirSync(path.join(root, 'js')).map(f => 'js/' + f), fs.readdirSync(path.join(root, 'tests')).map(f => 'tests/' + f));
      const source = sourceFiles.map(read).join('\n');
      for (const person of rows) { assert.ok(!source.includes(person.name), 'Private name leaked outside ignored data'); assert.ok(!source.includes(person.facebookUrl), 'Private URL leaked outside ignored data'); }
      console.log('Verified ' + rows.length + ' imported local records; personal details remain in the ignored file only.');
    });
    await check('Actual local file: every category, display view, sort, search, count, and reset uses the saved records', async () => {
      const local = { window: {} }; vm.runInNewContext(read('data/people.local.js'), local); const rows = local.window.DP_LOCAL_PEOPLE;
      for (const category of ['', 'ausbildung','fsj','bfd','au-pair']) for (const view of ['list','icon','full']) for (const sort of ['name-asc','name-desc','recent']) {
        const params = new URLSearchParams({ category, view, sort }); const d = await load('directory', '?' + params, { localFile: true, deferLocal: true });
        const expected = d.app.filterProfiles({ category, sort }); const result = d.byId('directory-results');
        assert.equal(result.dataset.view, view); assert.equal(result.children.length, rows.filter(row => !category || row.category === category).length);
        assert.equal(result.querySelectorAll('.card-facebook').length, expected.length);
        assert.equal(result.querySelectorAll('h3').map(node => node.textContent).join('|'), expected.map(row => row.name).join('|'));
        assert.equal(Number(d.byId('result-count').querySelector('strong').textContent), expected.length);
        for (const button of d.byId('category-filters').children) assert.equal(Number(button.querySelector('.filter-number').textContent), rows.filter(row => !button.dataset.category || row.category === button.dataset.category).length);
        if (expected.length) {
          const input = d.byId('directory-search'); input.value = expected[0].name; d.byId('directory-search-form').fire('submit');
          assert.equal(result.children.length, 1); assert.equal(result.querySelector('h3').textContent, expected[0].name);
          const params = new URLSearchParams(result.querySelector('.profile-card-main').href.split('?')[1]); const context = new URLSearchParams(params.get('from'));
          assert.equal(context.get('category') || '', category); assert.equal(context.get('view') || 'full', view); assert.equal(context.get('sort') || 'name-asc', sort);
        }
        d.byId('reset-filters').fire('click'); assert.equal(result.children.length, rows.length); assert.equal(result.dataset.view, view);
        assert.equal(d.byId('city-filter').querySelectorAll('option').length, new Set(rows.map(row => row.city).filter(Boolean)).size + 1);
      }
    });
  }
  console.log('\n' + passed + ' verification groups passed. Rendered browser and device QA remain unverified.');
}()).catch(error => { console.error(error); process.exitCode = 1; });
