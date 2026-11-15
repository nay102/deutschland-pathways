/* Development utility. Uses only Node built-ins; not required to open the website. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/data.js'), 'utf8'), sandbox);
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/demo-data.js'), 'utf8'), sandbox);
const palettes = [
  ['#dce9e0','#abc6b4','#3d6658','#e7d9bf'], ['#f1e1de','#dac1bc','#985f58','#f3dfc3'],
  ['#e0e7f0','#bccbdd','#3e526e','#c4b08d'], ['#f2e7d1','#d9c8a6','#a67d43','#f0dbb6'],
  ['#e7ecd9','#c8d2af','#6c784d','#dbd0b1'], ['#e7e1ed','#c8b7d2','#685879','#ddcbb2']
];
const women = new Set([1,3,4,6,8,10,12,14,16,17]);
const scarves = new Set([1,6,12]);
const skins = ['#bc825d','#cc9874','#ab7152','#d3a17c','#b67e5b'];
function avatar(index) {
  const [background, ornament, clothing, accent] = palettes[index % palettes.length];
  const skin = skins[index % skins.length];
  const female = women.has(index);
  const scarf = scarves.has(index);
  const hair = index % 3 === 0 ? '#253335' : '#382e2b';
  const hairBehind = female && !scarf ? '<path d="M120 191v-60c0-105 163-105 163 0v120l-155 7Z" fill="' + hair + '"/>' : '';
  const hijab = scarf ? '<path d="M119 244c-10-48-9-110 0-139 12-39 52-52 81-52s70 14 82 52c14 45 8 103 3 139l-21 43H133Z" fill="' + clothing + '"/>' : '';
  const fringe = scarf ? '<path d="M138 134c-7-62 116-81 125 0-26-15-44-30-62-43-13 22-32 34-63 43Z" fill="' + clothing + '"/>' : female ? '<path d="M136 133c-16-87 134-106 131 12-38-12-53-29-64-53-16 25-37 36-67 41Z" fill="' + hair + '"/>' : index % 3 === 1 ? '<path d="M133 145c-11-38-3-70 29-80 29-12 61-4 88-17 24 24 25 62 15 97l-13-37c-37 17-56-3-100 14l-10 31Z" fill="' + hair + '"/>' : '<path d="M134 144c-17-48-1-81 52-84 36-11 76 10 82 45l-3 38-14-33c-32 10-51-5-77 9-14 7-22-1-28 11l-6 25Z" fill="' + hair + '"/>';
  const beard = !female && index % 3 === 2 ? '<path d="M146 177c11 20 24 17 34 21 13-6 26-5 39 0 14-3 24-6 35-22-1 45-18 67-54 67-30 0-50-22-54-66Z" fill="' + hair + '" opacity=".9"/><path d="M182 207q18 11 36 0" fill="none" stroke="#bd8a6a" stroke-width="2"/>' : '<path d="M181 205q19 13 38 0" fill="none" stroke="#7c483e" stroke-width="3" stroke-linecap="round"/>';
  const glasses = [2,6,11,16].includes(index) ? '<g fill="none" stroke="#36433e" stroke-width="3"><rect x="151" y="151" width="39" height="27" rx="10"/><rect x="212" y="151" width="39" height="27" rx="10"/><path d="M190 159q11-7 22 0m-67-6 7 3m99 0 7-3"/></g>' : '';
  const collar = female ? '<path d="m145 274 55 51 55-51" fill="none" stroke="' + accent + '" stroke-width="7"/><path d="M200 326v54" stroke="' + accent + '" stroke-width="3"/>' : '<path d="m163 258 37 37-37 22-19-45Zm74 0-37 37 37 22 19-45Z" fill="' + accent + '"/><path d="M200 295v85" stroke="#ffffff40" stroke-width="2"/><circle cx="210" cy="335" r="2" fill="' + accent + '"/><circle cx="210" cy="360" r="2" fill="' + accent + '"/>';
  return '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="380" viewBox="0 0 400 380"><rect width="400" height="380" fill="' + background + '"/><circle cx="204" cy="179" r="137" fill="' + ornament + '" opacity=".5"/><circle cx="204" cy="179" r="156" fill="none" stroke="' + ornament + '" stroke-width="1"/><path d="M26 305V128m347 175V170M35 107h35m-18-18v35m289 113 4 11 11 4-11 4-4 11-4-11-11-4 11-4Z" stroke="' + ornament + '" fill="none" stroke-width="1.5"/>' + hairBehind + hijab + '<path d="M48 380c1-77 35-113 112-123h80c74 8 111 48 113 123Z" fill="' + clothing + '"/><path d="M175 220h51l9 45c-5 32-62 33-71 0Z" fill="' + skin + '"/><path d="M175 229q27 25 51 0v18q-23 18-51 1Z" fill="#754733" opacity=".17"/><ellipse cx="138" cy="167" rx="12" ry="20" fill="' + skin + '"/><ellipse cx="263" cy="167" rx="12" ry="20" fill="' + skin + '"/><path d="M139 123c2-39 118-45 123 0v48c-1 44-25 71-61 72-36-2-62-30-62-72Z" fill="' + skin + '"/>' + fringe + '<path d="m157 148 24-3m39 0 24 3" stroke="' + hair + '" stroke-width="4" stroke-linecap="round"/><path d="M160 163q8-6 15 0m52 0q8-6 15 0" stroke="#3e332c" stroke-width="3.5" stroke-linecap="round" fill="none"/><path d="m201 166-5 22h11" stroke="#87583f" opacity=".6" stroke-width="2" stroke-linecap="round" fill="none"/>' + beard + glasses + (scarf ? '<path d="M131 171c-7 56 15 70 69 97 49-27 73-43 72-97 12 32 12 76 6 97l-31 69-47-53-47 54-31-71Z" fill="' + clothing + '"/><path d="m143 226 57 58 58-58m-58 58 2 96" fill="none" stroke="' + accent + '" stroke-width="2" opacity=".55"/>' : collar) + '<path d="M99 330v50m204-50v50" stroke="#101b2c" opacity=".14" stroke-width="2"/>' + (female && !scarf ? '<circle cx="139" cy="190" r="5" fill="' + accent + '"/><circle cx="262" cy="190" r="5" fill="' + accent + '"/>' : '') + '</svg>';
}
sandbox.window.DPData.profiles.forEach(function (p, index) { fs.writeFileSync(path.join(root, p.image), avatar(index)); });
// Keep the independently designed themed placeholder intact.
console.log('Created 20 original SVG portraits; preserved the themed fallback artwork.');
