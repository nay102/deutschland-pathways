/* Shared pathway metadata and record validation. No personal or demo records. */
(function () {
  'use strict';
  const categories = [
    { id: 'ausbildung', label: 'Ausbildung', subtitle: 'Vocational training', icon: 'briefcase', color: 'green', description: 'Skills learned. A future shaped.' },
    { id: 'fsj', label: 'FSJ', subtitle: 'Voluntary social year', categoryNote: 'Includes FÖJ', icon: 'heart', color: 'gold', description: 'A year of giving and growing.' },
    { id: 'bfd', label: 'BFD', subtitle: 'Federal volunteer service', icon: 'sprout', color: 'blue', description: 'Purpose, found in the everyday.' },
    { id: 'au-pair', label: 'Au-pair', subtitle: 'Cultural exchange', icon: 'home', color: 'rose', description: 'New connections. A second home.' }
  ];
  function normalizeRecords(records, demo) {
    const seen = new Set();
    return records.filter(function (p) { return p && typeof p.id === 'string' && /^[a-z0-9-]{1,80}$/.test(p.id) && typeof p.name === 'string' && p.name.trim() && (categories.some(c => c.id === p.category) || (!demo && (p.category == null || p.category === ''))) && p.inGermany === true && !seen.has(p.id) && seen.add(p.id); }).map(function (p) {
      const text = key => typeof p[key] === 'string' ? p[key].trim() : '';
      return { id: p.id, name: text('name'), nameBn: text('nameBn'), category: p.category || '', pathwayNote: text('pathwayNote'), city: text('city'), arrivalYear: Number.isInteger(p.arrivalYear) && p.arrivalYear >= 1950 && p.arrivalYear <= new Date().getFullYear() ? p.arrivalYear : null, specialization: p.category === 'ausbildung' ? text('specialization') : '', description: text('description'), bio: Array.isArray(p.bio) ? p.bio.filter(item => typeof item === 'string' && item.trim()) : text('bio'), image: text('image'), gallery: Array.isArray(p.gallery) ? p.gallery.filter(item => item && typeof item.src === 'string') : [], facebookUrl: text('facebookUrl'), facebookPermission: p.facebookPermission === true, createdAt: Number.isFinite(Date.parse(p.createdAt)) ? p.createdAt : '', inGermany: true, isDemo: demo === true || p.isDemo === true };
    });
  }
  window.DPData = { categories: categories, profiles: [], mode: 'public', normalizeRecords: normalizeRecords };
}());
