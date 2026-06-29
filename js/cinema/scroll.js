import Lenis from '../vendor/lenis.mjs';

// Snappy smooth-scroll. `lerp` (not duration) keeps the wheel responsive —
// the page tracks the pointer closely instead of gliding to a slow stop —
// while ScrollTrigger stays in sync for the reveal timelines.
export function initScroll() {
  const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}
