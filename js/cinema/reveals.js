import { TIMING, EASE } from './config.js';

const GRID_SEL = '.benefit-grid, .usecase-grid, .product-grid, .feature-cards, .release-grid';

// Track ScrollTrigger instances created for split headlines so they can be
// killed and rebuilt on every language change.
let splitTriggers = [];

function buildSplitHeadlines() {
  const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;

  // Kill any previously-created triggers for split headlines.
  splitTriggers.forEach((st) => st.kill());
  splitTriggers = [];

  document.querySelectorAll('[data-reveal-split]').forEach((el) => {
    // Always re-split from live textContent so the current language is used.
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w) => `<span data-reveal-line>${w}</span>`).join(' ');

    const tween = gsap.to(el.querySelectorAll('[data-reveal-line]'), {
      opacity: 1, y: 0, duration: TIMING.base, ease: EASE.power, stagger: TIMING.stagger,
      scrollTrigger: { trigger: el, start: 'top 92%' },
    });
    // gsap.to returns a tween; its scrollTrigger property holds the ST instance.
    if (tween.scrollTrigger) splitTriggers.push(tween.scrollTrigger);
  });
}

export function initReveals() {
  const gsap = window.gsap;

  buildSplitHeadlines();

  // Per-element reveals — skip anything inside a grid (owned by the grid loop).
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    if (el.closest(GRID_SEL)) return;
    gsap.to(el, {
      opacity: 1, y: 0, duration: TIMING.base, ease: EASE.power,
      scrollTrigger: { trigger: el, start: 'top 94%' },
    });
  });

  // Stagger only revealable direct children of each grid.
  document.querySelectorAll(GRID_SEL).forEach((grid) => {
    gsap.to(grid.querySelectorAll(':scope > [data-reveal]'), {
      opacity: 1, y: 0, duration: TIMING.base, ease: EASE.power, stagger: TIMING.stagger,
      scrollTrigger: { trigger: grid, start: 'top 90%' },
    });
  });

  window.ScrollTrigger.refresh();

  // Rebuild split headlines (and re-fresh) whenever the language is toggled.
  document.addEventListener('i18n:change', () => {
    buildSplitHeadlines();
    window.ScrollTrigger.refresh();
  });
}
