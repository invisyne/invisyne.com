// Newsletter signup → Worker → Brevo double opt-in (invisyne.com-backend, POST /subscribe).
(() => {
  'use strict';
  const WORKER_URL = 'https://invisyne-questionnaire.invisyne.workers.dev/subscribe';
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const form = document.getElementById('nlForm');
  const done = document.getElementById('nlDone');
  const invalid = document.getElementById('nlInvalid');
  const error = document.getElementById('nlError');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    invalid.hidden = true;
    error.hidden = true;

    const email = form.email.value.trim();
    if (!EMAIL_RE.test(email)) {
      invalid.hidden = false;
      form.email.focus();
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          lang: window.INVISYNE_LANG === 'de' ? 'de' : 'en',
          honeypot: form.hp_check.value,
        }),
      });
      if (res.status === 400) { invalid.hidden = false; return; }
      if (!res.ok) throw new Error('subscribe failed with status ' + res.status);
      form.hidden = true;
      done.hidden = false;
    } catch (err) {
      error.hidden = false;
    } finally {
      btn.disabled = false;
    }
  });
})();
