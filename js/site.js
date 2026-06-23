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
      { value: 150,  unit: '+',      label: 'devices deployed in the field' },
      { value: 30,   unit: '%',      label: 'less unplanned downtime, documented' },
      { value: 50,   unit: 'ms',     label: 'sampling resolution at the edge' },
      { value: 5000, unit: 'vars/s', label: 'variables captured per second' },
    ];
    let i = 0;
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    function rotate() {
      const m = METRICS[i];
      unitEl.textContent = m.unit;
      labelEl.textContent = m.label;
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
      i = (i + 1) % METRICS.length;
    }
    rotate();
    if (!reduceMotion) setInterval(rotate, 3600);
  })();

})();
