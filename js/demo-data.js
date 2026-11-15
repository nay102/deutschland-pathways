/* Existing fictional fixtures for local development only; excluded from public exports. */
(function () {
  'use strict';
  const rows = [
    ['arif-hasan','Arif Hasan','আরিফ হাসান','ausbildung','Berlin',2023,'Hospitality','Learning a craft. Making Berlin home.'],
    ['nusrat-jahan','Nusrat Jahan','নুসরাত জাহান','fsj','Hamburg',2024,'','Finding connection through community care.'],
    ['rafi-islam','Rafi Islam','রাফি ইসলাম','bfd','Leipzig',2024,'','Contributing to a neighbourhood initiative.'],
    ['mehzabin-rahman','Mehzabin Rahman','মেহজাবিন রহমান','au-pair','Cologne',2025,'','Everyday life, shared across two cultures.'],
    ['sadia-akhtar','Sadia Akhtar','সাদিয়া আক্তার','ausbildung','Frankfurt',2024,'Logistics','Bringing order to things on the move.'],
    ['tanvir-ahmed','Tanvir Ahmed','তানভীর আহমেদ','ausbildung','Munich',2023,'IT systems','A practical mind. A new technical chapter.'],
    ['tahmina-sultana','Tahmina Sultana','তাহমিনা সুলতানা','fsj','Bremen',2025,'','Growing through meaningful everyday service.'],
    ['imran-kabir','Imran Kabir','ইমরান কবির','bfd','Dresden',2024,'','Caring for green spaces and local connections.'],
    ['farhana-akter','Farhana Akter','ফারহানা আক্তার','au-pair','Hamburg',2025,'','Discovering a city through family life.'],
    ['sakib-mahmud','Sakib Mahmud','সাকিব মাহমুদ','ausbildung','Stuttgart',2022,'Mechatronics','Turning curiosity into hands-on skills.'],
    ['ishrat-zaman','Ishrat Zaman','ইশরাত জামান','fsj','Berlin',2024,'','Listening, learning, and lending a hand.'],
    ['naim-hossain','Naim Hossain','নাঈম হোসেন','bfd','Hanover',2025,'','Part of a community, one day at a time.'],
    ['samira-haque','Samira Haque','সামিরা হক','au-pair','Munich',2024,'','Making room for new and familiar traditions.'],
    ['adnan-rahman','Adnan Rahman','আদনান রহমান','ausbildung','Hamburg',2023,'Retail','Building confidence through daily conversations.'],
    ['maliha-noor','Maliha Noor','মালিহা নূর','fsj','Bonn',2025,'','A shared sense of purpose in a new city.'],
    ['fahim-chowdhury','Fahim Chowdhury','ফাহিম চৌধুরী','bfd','Berlin',2024,'','Supporting a local arts and community project.'],
    ['priyanka-sen','Priyanka Sen','প্রিয়াঙ্কা সেন','au-pair','Cologne',2025,'','Collecting new words and everyday memories.'],
    ['nabila-khan','Nabila Khan','নাবিলা খান','fsj','Frankfurt',2024,'','Finding a new rhythm through social service.'],
    ['rayhan-uddin','Rayhan Uddin','রায়হান উদ্দিন','bfd','Düsseldorf',2023,'','Small contributions. Lasting connections.'],
    ['shuvo-das','Shuvo Das','শুভ দাস','au-pair','Leipzig',2025,'','Learning a language through a shared home.']
  ];
  const biographies = {
    ausbildung: 'This fictional record describes someone already living in Germany and completing vocational training. Their days combine practical experience, language learning, and the everyday routines of settling into a German city.',
    fsj: 'This fictional record describes someone already in Germany for a voluntary social year. Community activities, language practice, and getting to know a new city shape this imagined chapter.',
    bfd: 'This fictional record describes someone already living in Germany and participating in federal volunteer service. The story centres on contributing to local projects and building everyday connections.',
    'au-pair': 'This fictional record describes someone already in Germany for an au-pair cultural exchange. Shared household routines, language practice, and discovering a new city are part of this imagined experience.'
  };
  const demoProfiles = rows.map(function (r, index) { return { id: r[0], name: r[1], nameBn: r[2], category: r[3], city: r[4], arrivalYear: r[5], specialization: r[6], description: r[7], image: 'assets/images/' + r[0] + '.svg', bio: [biographies[r[3]]], gallery: index === 0 ? [{ src: 'assets/images/berlin-postcard.svg', alt: 'Illustrated Berlin postcard, not a personal photograph', caption: 'Berlin, illustrated · Demo gallery' }, { src: 'assets/images/first-chapter.svg', alt: 'Illustrated notebook and tea, not a personal photograph', caption: 'Everyday beginnings · Demo gallery' }] : [], facebookUrl: null, facebookPermission: false, createdAt: '2026-' + String(10 - Math.floor(index / 3)).padStart(2, '0') + '-' + String(25 - index).padStart(2, '0') + 'T12:00:00Z', inGermany: true, isDemo: true }; });
  window.DPData.profiles = window.DPData.normalizeRecords(demoProfiles, true);
  window.DPData.mode = 'demo';
}());
