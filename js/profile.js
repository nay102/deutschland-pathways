(function () {
  'use strict';
  window.DPPageReady = window.DPReady.then(function () {
    const app = window.DP; const el = app.el; const route = window.DPRoutes.href; const params = new URLSearchParams(location.search); const p = app.profiles().find(person => person.id === params.get('id')); const target = document.getElementById('profile-content');
    const context = new URLSearchParams(params.get('from') || ''); const safeContext = new URLSearchParams(); ['q', 'category', 'city', 'sort', 'view'].forEach(key => { if (context.has(key)) safeContext.set(key, context.get(key).slice(0, 100)); });
    if (safeContext.toString()) document.getElementById('back-to-directory').href = route('directory', '?' + safeContext);
    if (!p) { document.title = 'Profile not found — Deutschland Pathways'; const box = el('section', 'empty-state missing-profile'); box.append(app.icon('search'), el('p', 'eyebrow', 'A SMALL DETOUR'), el('h1', '', 'This person isn’t in the directory.'), el('p', '', 'The link may be incomplete, or this record may not be available in your current dataset.')); const link = el('a', 'button button-dark', 'Open the directory'); link.href = route('directory'); link.append(app.icon('arrow-right')); box.append(link); target.append(box); return; }
    const cat = app.recordCategory(p); document.title = p.name + ' — Deutschland Pathways'; document.getElementById('profile-breadcrumb').textContent = p.name;
    const header = el('section', 'profile-header reveal tone-' + cat.color);
    const visual = el('div', 'profile-visual'); const portrait = app.portrait(p, 'profile-large-portrait'); portrait.loading = 'eager'; visual.append(portrait); if (p.isDemo) visual.append(el('span', 'portrait-demo', 'ILLUSTRATED DEMO'));
    const mark = app.portraitMark(p); if (mark) visual.append(mark);
    const intro = el('div', 'profile-intro'); intro.append(el('p', 'eyebrow', 'DEUTSCHLAND PATHWAYS / PERSONAL RECORD'), el('span', 'category-badge badge-' + cat.color, cat.label), el('h1', '', p.name));
    if (p.nameBn) { const name = el('p', 'profile-name-bn', p.nameBn); name.lang = 'bn'; intro.append(name); }
    const facts = el('div', 'profile-facts');
    if (p.city) { const place = el('span'); place.append(app.icon('pin'), document.createTextNode(p.city + ', Germany')); facts.append(place); }
    if (p.arrivalYear) { const year = el('span'); year.append(app.icon('calendar'), document.createTextNode('In Germany since ' + p.arrivalYear)); facts.append(year); }
    if (facts.children.length) intro.append(facts);
    if (p.description) intro.append(el('p', 'profile-lede', p.description));
    const fb = app.facebookLink(p, 'button button-dark profile-facebook'); if (fb) intro.append(fb);
    header.append(visual, intro); target.append(header);
    const lower = el('div', 'profile-lower reveal');
    const aside = el('aside', 'record-details'); aside.append(el('p', 'eyebrow', 'AT A GLANCE'));
    const list = el('dl', 'record-facts');
    function fact(label, value) { if (!value) return; const row = el('div'); row.append(el('dt', '', label), el('dd', '', value)); list.append(row); }
    fact('Pathway', cat.label); fact('Provided detail', p.pathwayNote); fact('Based in', p.city ? p.city + ', Germany' : 'Germany'); fact('Arrival year', p.arrivalYear); if (p.category === 'ausbildung') fact('Specialization', p.specialization); aside.append(list);
    if (p.isDemo) aside.append(el('p', 'demo-record-note', 'Fictional person. All details and illustrations are demonstration content.'));
    const story = el('div', 'profile-story'); const paragraphs = Array.isArray(p.bio) ? p.bio : p.bio ? [p.bio] : [];
    if (paragraphs.length) { story.append(el('p', 'eyebrow', p.isDemo ? 'AN ILLUSTRATIVE CHAPTER' : 'ABOUT THIS PERSON'), el('h2', '', 'A little more about ' + p.name.split(' ')[0] + '.')); paragraphs.forEach(paragraph => story.append(el('p', 'bio-paragraph', paragraph))); }
    if (p.isDemo) { const note = el('div', 'profile-context-note'); note.append(el('span', 'status-dot'), el('p', '', 'Already in Germany, in this fictional example. No real personal information is included.')); story.append(note); }
    lower.append(aside); if (story.children.length) lower.append(story); else lower.classList.add('profile-lower-compact'); target.append(lower);
    if (p.gallery && p.gallery.length) { const gallery = el('section', 'profile-gallery reveal'); gallery.setAttribute('aria-label', p.isDemo ? 'Illustrative gallery' : 'Profile gallery'); gallery.append(el('p', 'eyebrow', p.isDemo ? 'ILLUSTRATIVE POSTCARDS' : 'A FEW MOMENTS'), el('h2', '', 'A closer look.')); const grid = el('div', 'gallery-grid'); p.gallery.forEach(item => { const figure = el('figure'); const img = app.image(item.src, item.alt || 'Gallery image for ' + p.name, 'gallery-image'); img.width = 640; img.height = 400; figure.append(img); if (item.caption) figure.append(el('figcaption', '', item.caption)); grid.append(figure); }); gallery.append(grid); target.append(gallery); }
    const related = p.category ? app.profiles().filter(person => person.category === p.category && person.id !== p.id).slice(0, 3) : []; if (related.length) { document.getElementById('related-section').hidden = false; document.getElementById('related-link').href = route('directory', '?category=' + encodeURIComponent(p.category)); app.renderCards(document.getElementById('related-profiles'), related); }
    app.reveal(target);
  });
}());
