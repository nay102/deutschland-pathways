/* Public builds never request local records or fall back to fictional people. */
(function () {
  'use strict';
  const rows = window.DP_PUBLIC_PEOPLE;
  if (!Array.isArray(rows) || rows.some(person => !person || person.isDemo === true)) throw new Error('Public data must contain approved records only');
  const result = window.DPData.normalizeRecords(rows, false);
  if (result.length !== rows.length || result.some(person => /(?:^|\/)private\//i.test(person.image) || person.gallery.some(item => /(?:^|\/)private\//i.test(item.src)))) throw new Error('Invalid public record');
  window.DPData.profiles = result;
  window.DPData.mode = 'public';
}());
