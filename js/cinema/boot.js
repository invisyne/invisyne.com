import { initScroll } from './scroll.js';
import { initReveals } from './reveals.js';

// The animated background (js/scene.js, a classic script) runs on its own and
// self-handles reduced-motion. This module only enables the snappy smooth-scroll
// and the scroll-reveal layer, gated behind a motion check.
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function boot() {
  // Reduced-motion: no .cinema-on (so all content is visible immediately),
  // no smooth-scroll hijack, no reveal animation. Background renders a static frame.
  if (reduceMotion) return;

  document.body.classList.add('cinema-on');
  // Reveals depend on the base hidden state from .cinema-on, so wire after the class is set.
  window.gsap.registerPlugin(window.ScrollTrigger);
  initReveals();
  initScroll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
