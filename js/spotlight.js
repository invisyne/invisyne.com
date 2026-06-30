/* =====================================================================
   INVISYNE — section spotlight
   Cycles a highlight (.is-spot) through the boxes of a group, one after
   another. Used on:
     · The Invisyne principle — .flow > .flow-step   (platform.html)
     · Why Invisyne           — .feature-cards > .feature-card (why.html)
     · Latest                 — .release-grid > .release (latest.html)
   Runs only while the group is in view; pauses under reduced-motion.
   No dependencies.
   ===================================================================== */
(() => {
  'use strict';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const GROUPS = [
    { container: '.flow',          item: '.flow-step' },
    { container: '.feature-cards', item: '.feature-card' },
    { container: '.release-grid',  item: '.release' },
  ];
  const INTERVAL = 1600;

  GROUPS.forEach((g) => {
    document.querySelectorAll(g.container).forEach((container) => {
      const items = Array.from(container.querySelectorAll(g.item));
      if (items.length < 2) return;

      let idx = -1, timer = 0;
      const step = () => {
        if (idx >= 0) items[idx].classList.remove('is-spot');
        idx = (idx + 1) % items.length;
        items[idx].classList.add('is-spot');
      };
      const start = () => { if (timer) return; step(); timer = setInterval(step, INTERVAL); };
      const stop = () => { clearInterval(timer); timer = 0; };

      // Start immediately so it always runs; the observer only pauses it
      // while the group is scrolled out of view (and resumes on return).
      start();
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
          entries.forEach((e) => { e.isIntersecting ? start() : stop(); });
        }, { threshold: 0 }).observe(container);
      }
    });
  });
})();
