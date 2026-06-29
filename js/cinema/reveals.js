import { TIMING, EASE } from './config.js';

export function initReveals() {
  const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;

  // Split flagged headlines into line spans for staggered reveal.
  document.querySelectorAll('[data-reveal-split]').forEach((el) => {
    if (el.dataset.split === 'done') return;
    const html = el.innerHTML;
    // Preserve existing inline markup (e.g. <span class="accent">) by splitting on spaces only.
    el.innerHTML = html.split(' ').map((w) => `<span data-reveal-line>${w}</span>`).join(' ');
    el.dataset.split = 'done';
  });

  document.querySelectorAll('[data-reveal-split]').forEach((el) => {
    gsap.to(el.querySelectorAll('[data-reveal-line]'), {
      opacity: 1, y: 0, duration: TIMING.base, ease: EASE.power, stagger: TIMING.stagger,
      scrollTrigger: { trigger: el, start: 'top 80%' },
    });
  });

  document.querySelectorAll('[data-reveal]').forEach((el) => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: TIMING.base, ease: EASE.power,
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  // Stagger panels within a grid.
  document.querySelectorAll('.benefit-grid, .usecase-grid, .product-grid, .feature-cards, .release-grid').forEach((grid) => {
    gsap.to(grid.children, {
      opacity: 1, y: 0, duration: TIMING.base, ease: EASE.power, stagger: TIMING.stagger,
      scrollTrigger: { trigger: grid, start: 'top 82%' },
    });
  });
}
