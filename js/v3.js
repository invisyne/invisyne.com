/* =====================================================================
   INVISYNE — homepage benefit ticker (two lines)
   Line 1 (data-ticker="apps"): applications listing
   Line 2 (data-ticker="nums"): numbers + achievable benefits
   Rows are built from bilingual lists and re-rendered on language change
   (works with js/i18n.js → 'i18n:change' event). Nav scroll/reveal is
   handled by js/site.js. No dependencies.
   ===================================================================== */
(() => {
  'use strict';

  // Line 1 — applications (from the Invisyne PM handbook)  [EN, DE]
  const APPS = [
    ['Commissioning & ramp-up',     'Inbetriebnahme & Hochlauf'],
    ['Troubleshooting & root-cause','Fehlersuche & Ursachenanalyse'],
    ['Condition monitoring',        'Zustandsüberwachung'],
    ['Prevent downtime',            'Stillstände vermeiden'],
    ['Fleet comparison',            'Flottenvergleich'],
    ['Predictive maintenance',      'Predictive Maintenance'],
    ['Knowledge retention',         'Wissenssicherung'],
    ['Service optimisation',        'Service-Optimierung'],
    ['Lifecycle intelligence',      'Lifecycle-Intelligenz'],
    ['Regulatory compliance',       'Regulatorische Compliance'],
  ];

  // Line 2 — numbers + achievable benefits + performance  [value, EN caption, DE caption]
  const NUMS = [
    ['−30 %',   'less downtime',        'weniger Stillstände'],
    ['+15 %',   'OEE',                  'OEE'],
    ['+10 %',   'faster commissioning', 'schnellere Inbetriebnahme'],
    ['5 min',   'avg. diagnosis time',  'Ø Diagnosezeit'],
    ['< 4 h',   'for installation',     'für Installation'],
    ['+100 %',  'asset understanding',  'höheres Anlagenverständnis'],
    ['5 000',   'variables / second',   'Variablen / Sekunde'],
    ['< 50 ms', 'sampling',             'Sampling'],
    ['1 mo–yrs', 'full local data retention', 'volle lokale Datenhaltung'],
    ['up to 5', 'contextual layers',    'Kontextebenen'],
  ];

  const appsRow = document.querySelector('[data-ticker="apps"]');
  const numsRow = document.querySelector('[data-ticker="nums"]');
  if (!appsRow && !numsRow) return;

  const buildApps = (de) => {
    const seq = [...APPS, ...APPS]; // duplicate so the −50% keyframe loops seamlessly
    return seq
      .map(([en, deName]) =>
        '<span class="ticker-item">' +
          '<span class="ticker-app">' + (de ? deName : en) + '</span>' +
          '<span class="ticker-dot" aria-hidden="true"></span>' +
        '</span>'
      )
      .join('');
  };

  const buildNums = (de) => {
    const seq = [...NUMS, ...NUMS];
    return seq
      .map(([v, en, deCap]) =>
        '<span class="ticker-item">' +
          '<span class="ticker-val">' + v + '</span>' +
          '<span class="ticker-cap">' + (de ? deCap : en) + '</span>' +
          '<span class="ticker-dot" aria-hidden="true"></span>' +
        '</span>'
      )
      .join('');
  };

  const render = () => {
    const de = (window.INVISYNE_LANG || document.documentElement.lang) === 'de';
    if (appsRow) appsRow.innerHTML = buildApps(de);
    if (numsRow) numsRow.innerHTML = buildNums(de);
  };

  render();
  document.addEventListener('i18n:change', render);

  /* ---- Pilot CTA headlines — rotate with each datamorph scene change ----
     Six headlines, each addressing a different customer. The datamorph
     iframe posts {source:'dataMorph', scene} on every scene change; we
     advance the headline in step. [EN, DE] */
  const HEADLINES = [
    { a: ['Turn machine data',  'Mach Maschinendaten'],    b: ['into decisions.', 'zu Entscheidungen.'] },
    { a: ['Understand how your','Verstehe, wie sich dein'], b: ['asset behaved.',  'Asset verhalten hat.'] },
    { a: ['Find the root cause','Finde die Ursache'],       b: ['in minutes.',     'in Minuten.'] },
    { a: ['Predict the',        'Das Unvorhersehbare'],     b: ['unpredictable.',  'vorhersagen.'] },
    { a: ['Operational',        'Operational'],             b: ['Intelligence.',   'Intelligence.'] }, // closing logo scene
    { a: ['Capture every relevant', 'Erfasse jedes relevante'], b: ['machine signal.', 'Maschinensignal.'] },
  ];

  const titleEl = document.getElementById('pilotTitle');
  if (titleEl) {
    const aEl = titleEl.querySelector('.pt-a');
    const bEl = titleEl.querySelector('.pt-b');
    let hi = 5; // first scene (0) shows "Every machine tells a story"
    const isDe = () => (window.INVISYNE_LANG || document.documentElement.lang) === 'de';
    const paint = () => {
      const h = HEADLINES[hi], l = isDe() ? 1 : 0;
      aEl.textContent = h.a[l];
      bEl.textContent = h.b[l];
    };
    const fadeTo = (n) => {
      if (n === hi) return;
      hi = n;
      titleEl.style.opacity = '0';
      setTimeout(() => { paint(); titleEl.style.opacity = '1'; }, 320);
    };

    // The 4 key headlines cycle across the six data scenes (order unchanged);
    // the closing invisyne logo scene (6) shows "Operational Intelligence".
    //   scene 0 → H5 Every machine tells a story   scene 4 → H3 Predict
    //   scene 1 → H1 Understand                    scene 5 → H0 Turn into decisions
    //   scene 2 → H2 Find root cause               scene 6 → H4 Operational Intelligence (logo)
    //   scene 3 → H3 Predict
    const SCENE_MAP = { 0: 5, 1: 1, 2: 2, 3: 3, 4: 3, 5: 0, 6: 4 };
    const KEY_COUNT = 4; // headlines 0-3 are the rotating keys used as the fallback rotation

    paint();
    const reduceM = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let gotMsg = false;

    // Primary: pick the headline that matches the current animation scene.
    window.addEventListener('message', (e) => {
      if (!e.data || e.data.source !== 'dataMorph') return;
      gotMsg = true;
      const n = SCENE_MAP[e.data.scene];
      if (n !== undefined) fadeTo(n);
    });
    // Fallback: only if scene messages never arrive (e.g. blocked), rotate
    // through the headlines so the CTA still animates.
    if (!reduceM) {
      setTimeout(() => {
        if (gotMsg) return;
        setInterval(() => { fadeTo((hi + 1) % KEY_COUNT); }, 6000);
      }, 8000);
    }
    document.addEventListener('i18n:change', paint);
  }
})();
