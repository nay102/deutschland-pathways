/* User-supplied personal directory. LOCAL ONLY — this file is excluded from Git.
   Links are approved for inclusion in this local directory by the user's import request.
   No consent for public publication is asserted. No profiles were scraped or verified.
   Categories follow the user's correction: Ausbildung by default, with the supplied
   FÖJ record grouped under FSJ, with the supplied BFD and Au-pair records separate.
   Other details stay blank. */
(function () {
  'use strict';
  const rows = [
    ['tanzim-medha', 'Tanzim Medha', 'https://www.facebook.com/tanzim.medha.2024', 'ausbildung', 'Ambulantepflege'],
    ['tanjina-akter-pria', 'Tanjina Akter Pria', 'https://www.facebook.com/tanjina.akter.pria.682462', 'ausbildung', 'Pflege'],
    ['re-za', 'Re Za', 'https://www.facebook.com/re.za.535544', 'fsj', '', 'FÖJ'],
    ['sajjadur-rahman', 'Sajjadur Rahman', 'https://www.facebook.com/profile.php?id=61567143073806'],
    ['abu-saleh', 'Abu Saleh', 'https://www.facebook.com/profile.php?id=100023542721349'],
    ['md-jillur-rahman-jony', 'Md Jillur Rahman Jony (Bee)', 'https://www.facebook.com/mdjillurrahmanjony111', 'bfd'],
    ['minhazul-shohan', 'Minhazul Shohan', 'https://www.facebook.com/minhazul.alamsohan.7'],
    ['safayet-sium', 'Safayet Sium (Zayn)', 'https://www.facebook.com/safayet.sium'],
    ['osman-goni', 'Osman Goni', 'https://www.facebook.com/profile.php?id=100007154920189'],
    ['sa-nela', 'S.A. Nela', 'https://www.facebook.com/profile.php?id=61590885807039'],
    ['nadiha-tahsin-nazifa', 'Nadiha Tahsin Nazifa', 'https://www.facebook.com/nadiha.tahsin.nazifa.2024'],
    ['nadim-hossen-joy', 'Nadim Hossen Joy', 'https://www.facebook.com/nadim.hossen.427108'],
    ['ashraf-ali-sakib', 'Ashraf Ali Sakib', 'https://www.facebook.com/ashraf.ali.sakib.58170'],
    ['na-dia', 'Na Dia (Nadi)', 'https://www.facebook.com/nadia.mim.170463'],
    ['rakibur-rahman-rafi', 'Rakibur Rahman Rafi', 'https://www.facebook.com/rakiburrahman.rafi.5'],
    ['md-asif', 'MD Asif (Mr Human)', 'https://www.facebook.com/asif1667'],
    ['tanjil-hossain', 'Tanjil Hossain', 'https://www.facebook.com/tanjil.hossen.598126/'],
    ['shihab-winkler', 'Shihab Winkler', 'https://www.facebook.com/profile.php?id=100084431274361'],
    ['shahriar-islam-taj', 'Shahriar Islam Taj (König)', 'https://www.facebook.com/profile.php?id=100000841272173', 'ausbildung', 'Construction'],
    ['arefin-s-naeem', 'Arefin S Naeem', 'https://www.facebook.com/profile.php?id=100069975608680'],
    ['md-arman-hossain', 'MD Arman Hossain (Tanjim)', 'https://www.facebook.com/ah.tanjim.007', 'au-pair'],
    ['md-saidul-islam', 'Md Saidul Islam', 'https://www.facebook.com/saiduli17'],
    ['sampurnw-chakma', 'Sampurnw Chakma', 'https://www.facebook.com/sampurnha.ckz'],
    ['ridoy-sikder', 'Ridoy Sikder (Hridu)', 'https://www.facebook.com/hridoy895'],
    ['foyshal-hossain', 'Foyshal Hossain', 'https://www.facebook.com/foyshall.hossain'],
    ['bappy', 'Bappy', 'https://www.facebook.com/00bappy'],
    ['mohammad-robin', 'Mohammad Robin', 'https://www.facebook.com/mohammad.robin.257268/'],
    ['tohidul-alam', 'Tohidul Alam', 'https://www.facebook.com/tohidul.alam.50999/'],
    ['saidur-rahman-rakib', 'Saidur Rahman Rakib', 'https://www.facebook.com/saidurrahmanrakib.bd/'],
    ['tasarof-hossain-khan', 'Tasarof Hossain Khan', 'https://www.facebook.com/khantasarof/'],
    ['omor-faruk', 'Omor Faruk', 'https://www.facebook.com/0.bappy/'],
    ['shakib-alam-pial', 'Shakib Alam Pial', 'https://www.facebook.com/shakibalam.pial/'],
    ['esrak-ehosan', 'Esrak Ehosan', 'https://www.facebook.com/esrak.ehosan/'],
    ['rj-zahid-hasan-joy', 'Rj Zahid Hasan Joy', 'https://www.facebook.com/rjzahid.joy1/'],
    ['sajid-newaz', 'Sajid Newaz', 'https://www.facebook.com/rjsajid.rjsajid/'],
    ['ahammed-raju', 'Ahämmed Raju', 'https://www.facebook.com/profile.php?id=100009625506800']
  ];
  window.DP_LOCAL_PEOPLE = rows.map(function (r) {
    return { id: r[0], name: r[1], nameBn: '', facebookUrl: r[2], facebookPermission: true, category: r[3] || 'ausbildung', specialization: r[4] || '', pathwayNote: r[5] || '', city: '', arrivalYear: null, description: '', bio: '', image: '', gallery: [], createdAt: '2026-11-10', inGermany: true, isDemo: false };
  });
}());
