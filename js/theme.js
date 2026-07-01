// Lightweight Dark/Light theme switch. Mirrors js/i18n.js.
// Initial theme resolves in order: saved choice > OS prefers-color-scheme >
// local time of day (dark 19:00-07:00) > dark. A manual pick is stored in
// localStorage and always wins on later visits. Applied by setting data-theme
// on <html>; CSS tokens under html[data-theme="light"] do the rest. The
// datamorph iframe is re-pointed at the matching theme. No deps.
(() => {
  'use strict';
  const STORE_KEY = 'invisyne-theme';
  const THEMES = ['dark', 'light'];

  function morphSrc(theme) {
    // Light runs OPAQUE: the animation's own #EEF0F5 backdrop matches the page,
    // so there is no transparent dark-trail "lens". Dark stays transparent so the
    // dark page shows through behind the bright particles.
    return theme === 'light'
      ? '/data-morph.html?bg=1&theme=light'
      : '/data-morph.html?bg=1&theme=dark&transparent=1';
  }

  function applyMorph(theme) {
    document.querySelectorAll('iframe.pilot-bg').forEach((f) => {
      const cur = f.getAttribute('src') || '';
      if (cur.indexOf('theme=' + theme) !== -1) return; // already on this theme
      f.src = morphSrc(theme);
    });
  }

  function applyLogos(theme) {
    // The negative (white) wordmark suits dark; the positive one suits light.
    const want = theme === 'light' ? 'pos' : 'neg';
    document.querySelectorAll('img.theme-logo').forEach((img) => {
      const src = img.getAttribute('src') || '';
      const next = src.replace(/-color-(pos|neg)\.svg/, '-color-' + want + '.svg');
      if (next !== src) img.setAttribute('src', next);
    });
  }

  function apply(theme) {
    if (THEMES.indexOf(theme) === -1) theme = 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('#themeSwitch button').forEach((b) => {
      b.classList.toggle('on', b.dataset.theme === theme);
    });
    window.INVISYNE_THEME = theme;
    applyMorph(theme);
    applyLogos(theme);
    document.dispatchEvent(new CustomEvent('theme:change', { detail: { theme } }));
  }

  function setTheme(theme) {
    try { localStorage.setItem(STORE_KEY, theme); } catch (e) { /* ignore */ }
    apply(theme);
  }

  // Wire the toggle.
  const sw = document.getElementById('themeSwitch');
  if (sw) {
    sw.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-theme]');
      if (btn) setTheme(btn.dataset.theme);
    });
  }

  function systemTheme() {
    try {
      if (window.matchMedia) {
        if (matchMedia('(prefers-color-scheme: light)').matches) return 'light';
        if (matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  function timeOfDayTheme() {
    const h = new Date().getHours();
    return (h < 7 || h >= 19) ? 'dark' : 'light';
  }

  // Initial theme: saved choice, else OS preference, else time of day.
  let initial;
  try { initial = localStorage.getItem(STORE_KEY); } catch (e) { /* ignore */ }
  if (THEMES.indexOf(initial) === -1) initial = systemTheme() || timeOfDayTheme();
  apply(initial);

  window.INVISYNE_THEME_API = { setTheme };
})();
