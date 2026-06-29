// Site interactions for the one-page site. Pure vanilla JS, no dependencies.
// The hero canvas lives in scene.js; this file drives the content sections.

(() => {
  'use strict';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Nav reveal + hero-canvas fade on scroll ---- */
  (() => {
    const nav = document.getElementById('nav');
    const canvas = document.getElementById('bg');
    const onScroll = () => {
      const vh = window.innerHeight || 1;
      if (nav) nav.classList.toggle('scrolled', window.scrollY > vh * 0.6);
      if (canvas) {
        // 1.0 over the hero, easing down to a faint ambient 0.12 once scrolled past it
        const f = Math.min(window.scrollY / vh, 1);
        canvas.style.opacity = (1 - f * 0.88).toFixed(3);
      }
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
  })();

  /* ---- KPI rotator: cycle metrics, ease the counter up ---- */
  (() => {
    const valEl = document.getElementById('kpiVal');
    const unitEl = document.getElementById('kpiUnit');
    const labelEl = document.getElementById('kpiLabel');
    if (!valEl || !unitEl || !labelEl) return;

    const METRICS = [
      { value: 150,  unit: '+',      key: 'kpi.m1', label: 'devices deployed in the field' },
      { value: 30,   unit: '%',      key: 'kpi.m2', label: 'less unplanned downtime, documented' },
      { value: 50,   unit: 'ms',     key: 'kpi.m3', label: 'sampling resolution at the edge' },
      { value: 5000, unit: 'vars/s', key: 'kpi.m4', label: 'variables captured per second' },
    ];
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    // Pick the label in the active language (German from window.INVISYNE_DE, else English).
    const labelFor = (m) => (window.INVISYNE_LANG === 'de' && window.INVISYNE_DE && window.INVISYNE_DE[m.key]) || m.label;

    let next = 0, shown = 0;
    function rotate() {
      shown = next;
      const m = METRICS[shown];
      unitEl.textContent = m.unit;
      labelEl.textContent = labelFor(m);
      if (reduceMotion) {
        valEl.textContent = m.value.toLocaleString();
      } else {
        const start = performance.now();
        const dur = 1400;
        (function frame(now) {
          const t = Math.min((now - start) / dur, 1);
          valEl.textContent = Math.floor(easeOutCubic(t) * m.value).toLocaleString();
          if (t < 1) requestAnimationFrame(frame);
        })(start);
      }
      next = (next + 1) % METRICS.length;
    }
    rotate();
    if (!reduceMotion) setInterval(rotate, 3600);
    // Re-render the current label when the language is toggled.
    document.addEventListener('i18n:change', () => { labelEl.textContent = labelFor(METRICS[shown]); });
  })();

})();
