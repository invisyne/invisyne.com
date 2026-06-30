/* =====================================================================
   INVISYNE — product carousel
   Transform-based slider: 2 cards visible on desktop, 1 on mobile, with a
   smooth sliding effect. Prev/next arrows, dots, and gentle auto-advance
   (paused on hover/focus and under reduced-motion).
   Markup:
     .carousel > .carousel-viewport > .carousel-track > .product (cards)
              > .carousel-controls > [data-prev] .carousel-dots [data-next]
   No dependencies.
   ===================================================================== */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  document.querySelectorAll('.carousel').forEach((root) => {
    const track = root.querySelector('.carousel-track');
    const cards = Array.from(track.querySelectorAll('.product'));
    const prev = root.querySelector('[data-prev]');
    const next = root.querySelector('[data-next]');
    const dotsBox = root.querySelector('.carousel-dots');
    if (cards.length < 2) return;

    let index = 0;
    let dots = [];

    const perView = () => (window.innerWidth <= 720 ? 1 : 2);
    const maxIndex = () => Math.max(0, cards.length - perView());
    const step = () => {
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return cards[0].getBoundingClientRect().width + gap;
    };

    function buildDots() {
      if (!dotsBox) return;
      dotsBox.innerHTML = '';
      dots = [];
      for (let i = 0; i <= maxIndex(); i++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        b.addEventListener('click', () => goTo(i, true));
        dotsBox.appendChild(b);
        dots.push(b);
      }
    }

    function render() {
      index = clamp(index, 0, maxIndex());
      track.style.transform = 'translateX(' + (-index * step()) + 'px)';
      dots.forEach((d, k) => d.classList.toggle('on', k === index));
      if (prev) prev.disabled = index === 0;
      if (next) next.disabled = index === maxIndex();
    }

    function goTo(i, user) {
      index = clamp(i, 0, maxIndex());
      render();
      if (user) restart();
    }

    prev && prev.addEventListener('click', () => goTo(index - 1, true));
    next && next.addEventListener('click', () => goTo(index + 1, true));

    // auto-advance (loops back to the start)
    let timer = 0;
    function restart() {
      if (reduce) return;
      clearInterval(timer);
      timer = setInterval(() => {
        index = index >= maxIndex() ? 0 : index + 1;
        render();
      }, 5200);
    }
    function stop() { clearInterval(timer); timer = 0; }
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', restart);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', restart);

    // rebuild on resize (per-view may flip between 1 and 2)
    let rt = 0;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => { buildDots(); render(); }, 150);
    });

    buildDots();
    render();
    restart();
  });
})();
