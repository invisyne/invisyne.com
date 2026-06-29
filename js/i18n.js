// Lightweight EN/DE switch. English lives in the DOM as the source of truth;
// German comes from window.INVISYNE_DE (js/translations.de.js). No dependencies.
(() => {
  'use strict';
  const STORE_KEY = 'invisyne-lang';
  const DE = window.INVISYNE_DE || {};

  // Cache the original (English) markup of every translatable node.
  const nodes = Array.from(document.querySelectorAll('[data-i18n]'));
  nodes.forEach((el) => { el.dataset.en = el.innerHTML; });

  function apply(lang) {
    const useDe = lang === 'de';
    nodes.forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const de = DE[key];
      el.innerHTML = useDe && de != null && de !== '' ? de : el.dataset.en;
    });
    document.documentElement.lang = useDe ? 'de' : 'en';
    document.querySelectorAll('#langSwitch button').forEach((b) => {
      b.classList.toggle('on', b.dataset.lang === lang);
    });
    window.INVISYNE_LANG = lang;
    document.dispatchEvent(new CustomEvent('i18n:change', { detail: { lang } }));
  }

  function setLang(lang) {
    try { localStorage.setItem(STORE_KEY, lang); } catch (e) { /* ignore */ }
    apply(lang);
  }

  // Wire the toggle.
  const sw = document.getElementById('langSwitch');
  if (sw) {
    sw.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-lang]');
      if (btn) setLang(btn.dataset.lang);
    });
  }

  // Initial language: saved choice, else English.
  let initial = 'en';
  try { initial = localStorage.getItem(STORE_KEY) || 'en'; } catch (e) { /* ignore */ }
  apply(initial);

  // Expose a tiny helper for other scripts (e.g. the KPI rotator).
  window.INVISYNE_I18N = { setLang, t: (key) => (window.INVISYNE_LANG === 'de' && DE[key]) || null };
})();
