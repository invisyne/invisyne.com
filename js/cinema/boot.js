import * as scene from './scene-webgl.js';
import { initScroll } from './scroll.js';
import { initReveals } from './reveals.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = document.getElementById('bg');

function webglSupported() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) {
    return false;
  }
}

function fallback() {
  // No WebGL / reduced-motion: static brand gradient, content visible, no reveals.
  if (canvas) canvas.classList.add('cin-fallback');
}

function boot() {
  if (reduceMotion) { fallback(); return; }
  const ok = canvas && webglSupported() && scene.init(canvas);
  if (!ok) { fallback(); return; }

  document.body.classList.add('cinema-on');
  // Reveals depend on the base hidden state from .cinema-on, so wire after the class is set.
  window.gsap.registerPlugin(window.ScrollTrigger);
  initReveals();
  initScroll(scene);
  addEventListener('resize', () => scene.resize(), { passive: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else { boot(); }
