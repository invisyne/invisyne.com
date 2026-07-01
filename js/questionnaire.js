/* =====================================================================
   INVISYNE — Questionnaire (yes/no quiz + lead capture)
   Bilingual (reads window.INVISYNE_LANG). Self-contained; renders into
   #questionnaire. Submits to the invisyne-questionnaire-backend Worker.
   ===================================================================== */
(() => {
  'use strict';
  const root = document.getElementById('questionnaire');
  if (!root) return;

  const Q = window.INVISYNE_QUESTIONNAIRE_QUESTIONS || [];

  // Deployed Worker endpoint (invisyne-questionnaire-backend, Task 7).
  const WORKER_URL = 'https://invisyne-questionnaire.invisyne.workers.dev/submit';

  const LEVELS = [
    { en: { name: 'Emerging', desc: 'Data exists, but behaviour is hard to compare or trace. A pilot can establish your first baseline.' },
      de: { name: 'Emerging', desc: 'Daten sind vorhanden, aber Verhalten ist schwer vergleichbar oder nachvollziehbar. Ein Pilot schafft Ihre erste Baseline.' } },
    { en: { name: 'Developing', desc: 'You have the building blocks. Continuous memory and context would unlock much faster answers.' },
      de: { name: 'Developing', desc: 'Sie haben die Bausteine. Kontinuierliches Gedächtnis und Kontext liefern deutlich schnellere Antworten.' } },
    { en: { name: 'Advanced', desc: 'Strong foundations. You are ready to scale comparison, root-cause, and service across the fleet.' },
      de: { name: 'Advanced', desc: 'Starke Grundlagen. Sie sind bereit, Vergleich, Ursachenanalyse und Service über die Flotte zu skalieren.' } },
    { en: { name: 'Operational Intelligence Ready', desc: 'You already operate on machine intelligence. Invisyne helps you turn it into new service and product value.' },
      de: { name: 'Operational Intelligence Ready', desc: 'Sie arbeiten bereits mit Maschinenintelligenz. Invisyne hilft, daraus neuen Service- und Produktwert zu schaffen.' } },
  ];

  const T = {
    q: { en: 'Question', de: 'Frage' },
    of: { en: 'of', de: 'von' },
    yes: { en: 'Yes', de: 'Ja' },
    no: { en: 'No', de: 'Nein' },
    resultLabel: { en: 'Your maturity level', de: 'Ihr Reifegrad' },
    score: { en: 'You answered "yes" to', de: 'Sie haben „Ja“ beantwortet bei' },
    outof: { en: 'of', de: 'von' },
    restart: { en: 'Start over', de: 'Neu starten' },
    formTitle: { en: 'Get your personal result', de: 'Holen Sie sich Ihr persönliches Ergebnis' },
    name: { en: 'Name', de: 'Name' },
    email: { en: 'Work email', de: 'Geschäftliche E-Mail' },
    company: { en: 'Company', de: 'Firma' },
    submit: { en: 'Send my result', de: 'Ergebnis senden' },
    submitting: { en: 'Sending…', de: 'Wird gesendet…' },
    privacy: {
      en: 'By submitting, you agree that Invisyne may contact you about your result. See our <a href="https://www.dr-ecklebe.de/en/privacy-policy" target="_blank" rel="noopener">privacy policy</a>.',
      de: 'Mit dem Absenden stimmen Sie zu, dass Invisyne Sie bezüglich Ihres Ergebnisses kontaktieren darf. Siehe unsere <a href="https://www.dr-ecklebe.de/datenschutz/" target="_blank" rel="noopener">Datenschutzerklärung</a>.',
    },
    successTitle: { en: 'Thank you!', de: 'Danke!' },
    successBody: {
      en: 'Check your inbox — we’ve sent your result and will follow up shortly.',
      de: 'Schauen Sie in Ihr Postfach — wir haben Ihnen Ihr Ergebnis gesendet und melden uns in Kürze.',
    },
    errorBody: { en: 'Something went wrong. Please try again.', de: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.' },
  };

  let idx = 0;
  let answersLog = [];
  let done = false;
  let submitted = false;

  const lang = () => ((window.INVISYNE_LANG || document.documentElement.lang) === 'de' ? 'de' : 'en');
  const levelFor = (score, total) => {
    const r = total ? score / total : 0;
    return r < 0.3 ? 0 : r < 0.6 ? 1 : r < 0.85 ? 2 : 3;
  };
  const score = () => answersLog.filter((a) => a.answer).length;

  function render() {
    const l = lang();
    if (!done) renderQuestion(l);
    else if (!submitted) renderResultAndForm(l);
    else renderSuccess(l);
  }

  function renderQuestion(l) {
    const pct = Math.round((idx / Q.length) * 100);
    const q = Q[idx];
    root.innerHTML =
      '<p class="assess-progress">' + T.q[l] + ' ' + (idx + 1) + ' ' + T.of[l] + ' ' + Q.length + '</p>' +
      '<div class="assess-bar"><span style="width:' + pct + '%"></span></div>' +
      '<p class="assess-q">' + q[l] + '</p>' +
      '<div class="assess-actions">' +
        '<button class="btn btn-primary" data-ans="1">' + T.yes[l] + '</button>' +
        '<button class="btn btn-ghost" data-ans="0">' + T.no[l] + '</button>' +
      '</div>';
    root.querySelectorAll('[data-ans]').forEach((b) =>
      b.addEventListener('click', () => {
        answersLog.push({ question: q[l], answer: b.dataset.ans === '1' });
        idx++;
        if (idx >= Q.length) done = true;
        render();
      })
    );
  }

  function renderResultAndForm(l) {
    const s = score();
    const li = levelFor(s, Q.length);
    const level = LEVELS[li][l];
    root.innerHTML =
      '<div class="assess-result">' +
        '<p class="assess-progress">' + T.resultLabel[l] + '</p>' +
        '<p class="level grad-text">' + level.name + '</p>' +
        '<p class="lede">' + level.desc + '</p>' +
        '<p class="assess-progress">' + T.score[l] + ' ' + s + ' ' + T.outof[l] + ' ' + Q.length + '</p>' +
        '<form class="assess-form" id="leadForm" style="margin-top:1.8rem">' +
          '<p class="assess-q" style="font-size:1.2rem;margin-bottom:1rem">' + T.formTitle[l] + '</p>' +
          '<div class="assess-field"><label for="lf-name">' + T.name[l] + '</label><input id="lf-name" name="name" type="text" required maxlength="200"></div>' +
          '<div class="assess-field"><label for="lf-email">' + T.email[l] + '</label><input id="lf-email" name="email" type="email" required maxlength="200"></div>' +
          '<div class="assess-field"><label for="lf-company">' + T.company[l] + '</label><input id="lf-company" name="company" type="text" required maxlength="200"></div>' +
          '<div class="assess-field hp-field" aria-hidden="true"><label for="lf-hp">Company website</label><input id="lf-hp" name="honeypot" type="text" tabindex="-1" autocomplete="off"></div>' +
          '<p class="assess-hint">' + T.privacy[l] + '</p>' +
          '<div class="assess-actions">' +
            '<button class="btn btn-primary" type="submit">' + T.submit[l] + '</button>' +
            '<button class="btn btn-ghost" type="button" data-restart>' + T.restart[l] + '</button>' +
          '</div>' +
          '<p class="assess-status" id="lf-status"></p>' +
        '</form>' +
      '</div>';

    root.querySelector('[data-restart]').addEventListener('click', restart);
    root.querySelector('#leadForm').addEventListener('submit', (e) => {
      e.preventDefault();
      handleSubmit(e.target, l);
    });
  }

  function renderSuccess(l) {
    root.innerHTML =
      '<div class="assess-result">' +
        '<p class="level grad-text">' + T.successTitle[l] + '</p>' +
        '<p class="lede">' + T.successBody[l] + '</p>' +
        '<div class="assess-actions" style="margin-top:1.4rem">' +
          '<button class="btn btn-ghost" data-restart>' + T.restart[l] + '</button>' +
        '</div>' +
      '</div>';
    root.querySelector('[data-restart]').addEventListener('click', restart);
  }

  function restart() {
    idx = 0; answersLog = []; done = false; submitted = false;
    render();
  }

  async function handleSubmit(form, l) {
    const btn = form.querySelector('button[type="submit"]');
    const status = form.querySelector('#lf-status');
    if (btn.disabled) return;

    btn.disabled = true;
    btn.textContent = T.submitting[l];
    status.textContent = '';
    status.classList.remove('error');

    const payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      company: form.company.value.trim(),
      honeypot: form.honeypot.value,
      lang: l,
      answers: answersLog,
    };

    try {
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('submit failed with status ' + res.status);
      submitted = true;
      render();
    } catch (e) {
      btn.disabled = false;
      btn.textContent = T.submit[l];
      status.textContent = T.errorBody[l];
      status.classList.add('error');
    }
  }

  render();
  document.addEventListener('i18n:change', render);
})();
