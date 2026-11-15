/* Optional classic script loading works under file:// without fetch or modules. */
(function () {
  'use strict';
  window.DPLocalReady = new Promise(function (resolve) {
    const script = document.createElement('script');
    script.src = 'data/people.local.js';
    script.onload = function () {
      if (Array.isArray(window.DP_LOCAL_PEOPLE)) {
        const result = window.DPData.normalizeRecords(window.DP_LOCAL_PEOPLE, false);
        // Never silently drop invalid private records: keep the explicitly labelled demo fallback.
        if (result.length === window.DP_LOCAL_PEOPLE.length) {
          window.DPData.profiles = result;
          window.DPData.mode = 'local';
        } else window.DPData.mode = 'demo-fallback';
      } else if (window.DP_LOCAL_PEOPLE != null) window.DPData.mode = 'demo-fallback';
      resolve();
    };
    script.onerror = function () { resolve(); };
    document.head.append(script);
  });
}());
