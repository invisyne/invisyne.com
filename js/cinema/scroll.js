import Lenis from '../vendor/lenis.mjs';

export function initScroll(scene) {
  const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Master: page scroll progress → scene camera/uniforms.
  ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => scene.setProgress(self.progress),
  });

  scene.start();
  return lenis;
}
