/* =====================================================================
   INVISYNE — Lead-qualification questionnaire (engine)
   Reads content from window.INVISYNE_QUESTIONNAIRE (js/questionnaire-questions.js).
   Bilingual (window.INVISYNE_LANG). Self-contained; renders into #questionnaire.
   Persona gate → shared + persona questions → contact → submit to the Worker.

   Flow: gate → questions → form → success
   Persona can be preselected via URL: questionnaire.html?p=oem|operator|both
   (skips the gate so sales can send a persona-specific link).

   Submits the same shape the existing Worker expects (name/email/company/
   honeypot/lang/answers) plus: persona, role, phone, and per-answer {id, goal}.
   ===================================================================== */
(() => {
  'use strict';
  const root = document.getElementById('questionnaire');
  if (!root) return;

  const DATA = window.INVISYNE_QUESTIONNAIRE || {};
  const SHARED = DATA.shared || [];
  const BY = DATA.byPersona || {};
  const PERSONAS = DATA.personas || [];
  const CONTACT = DATA.contact || { fields: [] };

  // Deployed Worker endpoint (invisyne-questionnaire-backend).
  const WORKER_URL = 'https://invisyne-questionnaire.invisyne.workers.dev/submit';

  const T = {
    q: { en: 'Question', de: 'Frage' },
    of: { en: 'of', de: 'von' },
    yes: { en: 'Yes', de: 'Ja' },
    no: { en: 'No', de: 'Nein' },
    cont: { en: 'Continue', de: 'Weiter' },
    back: { en: '← Back', de: '← Zurück' },
    other: { en: 'Something else', de: 'Etwas anderes' },
    otherPh: { en: 'Tell us more…', de: 'Erzählen Sie mehr…' },
    submit: { en: 'Send', de: 'Absenden' },
    submitting: { en: 'Sending…', de: 'Wird gesendet…' },
    privacy: {
      en: 'By submitting, you agree that Invisyne may contact you about your enquiry. See our <a href="https://www.dr-ecklebe.de/en/privacy-policy" target="_blank" rel="noopener">privacy policy</a>.',
      de: 'Mit dem Absenden stimmen Sie zu, dass Invisyne Sie zu Ihrer Anfrage kontaktieren darf. Siehe unsere <a href="https://www.dr-ecklebe.de/datenschutz/" target="_blank" rel="noopener">Datenschutzerklärung</a>.',
    },
    successTitle: { en: 'Thank you!', de: 'Danke!' },
    successBody: {
      en: 'We’ve got your answers and will follow up shortly with something relevant to your case.',
      de: 'Wir haben Ihre Antworten erhalten und melden uns in Kürze mit etwas Passendem zu Ihrem Vorhaben.',
    },
    errorBody: { en: 'Something went wrong. Please try again.', de: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.' },
  };

  // ---- State ----
  let persona = null;      // 'oem' | 'operator' | 'both'
  let personaLocked = false; // true when set via ?p= (gate is then skipped)
  let steps = [];          // question objects for the chosen persona
  let idx = 0;
  const answers = {};      // id -> { question, goal, type, answer(display), raw }
  const contactState = {}; // field id -> value (persisted across re-render)
  let stage = 'gate';      // 'gate' | 'questions' | 'form' | 'success'

  const lang = () => ((window.INVISYNE_LANG || document.documentElement.lang) === 'de' ? 'de' : 'en');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Persona preselect via URL (?p=oem).
  try {
    const p = new URLSearchParams(location.search).get('p');
    if (p && PERSONAS.some((x) => x.id === p)) { setPersona(p); personaLocked = true; stage = 'questions'; }
  } catch (e) { /* no-op */ }

  function setPersona(id) {
    persona = id;
    steps = SHARED.concat(BY[id] || []);
  }

  // ---- Render dispatch ----
  function render() {
    const l = lang();
    if (stage === 'gate') renderGate(l);
    else if (stage === 'questions') renderQuestion(l);
    else if (stage === 'form') renderForm(l);
    else renderSuccess(l);
  }

  function backButton(l) {
    return '<button type="button" class="assess-back" data-back>' + T.back[l] + '</button>';
  }

  // ---- Gate ----
  function renderGate(l) {
    root.innerHTML =
      '<p class="assess-q">' + esc(DATA.gate ? DATA.gate.q[l] : '') + '</p>' +
      '<div class="assess-opts">' +
        PERSONAS.map((p) =>
          '<button type="button" class="assess-opt round" data-persona="' + p.id + '">' +
            '<span class="mark"></span><span>' + esc(p[l]) + '</span>' +
          '</button>'
        ).join('') +
      '</div>';
    root.querySelectorAll('[data-persona]').forEach((b) =>
      b.addEventListener('click', () => {
        setPersona(b.dataset.persona);
        idx = 0; stage = 'questions'; render();
      })
    );
  }

  // ---- Questions ----
  function renderQuestion(l) {
    const q = steps[idx];
    const total = steps.length;
    const pct = Math.round((idx / total) * 100);
    const prev = answers[q.id];

    let body = '';
    if (q.type === 'single') {
      body = optionList(q, l, false, prev);
    } else if (q.type === 'multi') {
      body = optionList(q, l, true, prev);
      if (q.allowOther) body += otherField(q, l, prev);
    } else if (q.type === 'text') {
      body = textField(q, l, prev);
    }

    const showContinue = q.type === 'multi' || q.type === 'text';
    const hint = q.hint ? '<p class="assess-hint" style="margin:-1rem 0 1.4rem">' + esc(q.hint[l]) + '</p>' : '';

    root.innerHTML =
      '<p class="assess-progress">' + T.q[l] + ' ' + (idx + 1) + ' ' + T.of[l] + ' ' + total + '</p>' +
      '<div class="assess-bar"><span style="width:' + pct + '%"></span></div>' +
      '<p class="assess-q">' + esc(q.q[l]) + '</p>' +
      hint + body +
      (showContinue
        ? '<div class="assess-actions assess-next"><button type="button" class="btn btn-primary" data-continue>' + T.cont[l] + '</button></div>'
        : '') +
      (idx > 0 || !personaLocked ? backButton(l) : '');

    wireQuestion(q, l);
  }

  function optionList(q, l, multi, prev) {
    const selected = new Set(multi && prev && Array.isArray(prev.raw) ? prev.raw : (prev && !multi ? [prev.raw] : []));
    return '<div class="assess-opts">' +
      q.options.map((o) =>
        '<button type="button" class="assess-opt ' + (multi ? '' : 'round ') + (selected.has(o.id) ? 'sel' : '') + '" data-opt="' + o.id + '">' +
          '<span class="mark"></span><span>' + esc(o[l]) + '</span>' +
        '</button>'
      ).join('') +
      '</div>';
  }

  function otherField(q, l, prev) {
    const val = prev && prev.otherText ? esc(prev.otherText) : '';
    return '<div class="assess-field assess-other">' +
      '<label>' + T.other[l] + '</label>' +
      '<input type="text" data-other maxlength="300" placeholder="' + esc(T.otherPh[l]) + '" value="' + val + '">' +
      '</div>';
  }

  function textField(q, l, prev) {
    const val = prev && prev.raw ? esc(prev.raw) : '';
    const ph = q.placeholder ? esc(q.placeholder[l]) : '';
    return '<div class="assess-field" style="max-width:560px">' +
      '<textarea data-text maxlength="600" placeholder="' + ph + '">' + val + '</textarea>' +
      '</div>';
  }

  function wireQuestion(q, l) {
    const backEl = root.querySelector('[data-back]');
    if (backEl) backEl.addEventListener('click', goBack);

    if (q.type === 'single') {
      root.querySelectorAll('[data-opt]').forEach((b) =>
        b.addEventListener('click', () => {
          const o = q.options.find((x) => x.id === b.dataset.opt);
          answers[q.id] = { question: q.q[l], goal: q.goal, type: q.type, answer: o[l], raw: o.id };
          advance();
        })
      );
      return;
    }

    if (q.type === 'multi') {
      root.querySelectorAll('[data-opt]').forEach((b) =>
        b.addEventListener('click', () => b.classList.toggle('sel'))
      );
      root.querySelector('[data-continue]').addEventListener('click', () => {
        const picked = Array.from(root.querySelectorAll('.assess-opt.sel')).map((b) => b.dataset.opt);
        const labels = picked.map((id) => q.options.find((x) => x.id === id)[l]);
        const otherEl = root.querySelector('[data-other]');
        const otherText = otherEl ? otherEl.value.trim() : '';
        if (otherText) labels.push(otherText);
        answers[q.id] = { question: q.q[l], goal: q.goal, type: q.type, answer: labels.join(', '), raw: picked, otherText };
        advance();
      });
      return;
    }

    if (q.type === 'text') {
      const ta = root.querySelector('[data-text]');
      root.querySelector('[data-continue]').addEventListener('click', () => {
        const v = ta.value.trim();
        if (!v && !q.optional) { ta.focus(); ta.style.borderColor = 'var(--warn)'; return; }
        answers[q.id] = { question: q.q[l], goal: q.goal, type: q.type, answer: v, raw: v };
        advance();
      });
      ta.focus();
    }
  }

  function advance() {
    idx++;
    if (idx >= steps.length) stage = 'form';
    render();
  }

  function goBack() {
    if (idx > 0) { idx--; stage = 'questions'; }
    else if (!personaLocked) { stage = 'gate'; persona = null; }
    render();
  }

  // ---- Contact form ----
  function renderForm(l) {
    const fieldHtml = (CONTACT.fields || []).map((f) => {
      const req = f.required ? '<span class="req" aria-hidden="true">*</span>' : '';
      const ph = f.placeholder ? ' placeholder="' + esc(f.placeholder[l]) + '"' : '';
      const val = contactState[f.id] ? ' value="' + esc(contactState[f.id]) + '"' : '';
      return '<div class="assess-field">' +
        '<label for="lf-' + f.id + '">' + esc(f.label[l]) + req + '</label>' +
        '<input id="lf-' + f.id + '" name="' + f.id + '" type="' + f.type + '"' + (f.required ? ' required' : '') + ' maxlength="200"' + ph + val + '>' +
        '</div>';
    }).join('');

    root.innerHTML =
      '<form class="assess-form" id="leadForm">' +
        '<p class="assess-q" style="font-size:1.2rem;margin-bottom:1rem">' + esc((CONTACT.title || T.formTitle || {})[l] || '') + '</p>' +
        fieldHtml +
        '<div class="assess-field hp-field" aria-hidden="true"><label for="lf-hp">Leave this field empty</label><input id="lf-hp" name="hp_check" type="text" tabindex="-1" autocomplete="off" data-lpignore="true"></div>' +
        '<p class="assess-hint">' + T.privacy[l] + '</p>' +
        '<div class="assess-actions">' +
          '<button class="btn btn-primary" type="submit">' + T.submit[l] + '</button>' +
        '</div>' +
        '<p class="assess-status" id="lf-status"></p>' +
      '</form>' +
      backButton(l);

    root.querySelector('[data-back]').addEventListener('click', () => {
      // Save what's typed, step back into the last question.
      saveContact(root.querySelector('#leadForm'));
      idx = steps.length - 1; stage = 'questions'; render();
    });
    root.querySelector('#leadForm').addEventListener('submit', (e) => {
      e.preventDefault();
      handleSubmit(e.target, l);
    });
  }

  function saveContact(form) {
    (CONTACT.fields || []).forEach((f) => {
      const el = form.querySelector('#lf-' + f.id);
      if (el) contactState[f.id] = el.value;
    });
  }

  function renderSuccess(l) {
    root.innerHTML =
      '<div class="assess-result">' +
        '<p class="level grad-text">' + T.successTitle[l] + '</p>' +
        '<p class="lede">' + T.successBody[l] + '</p>' +
      '</div>';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(form, l) {
    const btn = form.querySelector('button[type="submit"]');
    const status = form.querySelector('#lf-status');
    if (btn.disabled) return;

    saveContact(form);

    btn.disabled = true;
    btn.textContent = T.submitting[l];
    status.textContent = '';
    status.classList.remove('error');

    // answers array in step order, tagged with id + BANT goal for the email.
    const answerList = steps.map((q) => {
      const a = answers[q.id] || {};
      return { id: q.id, goal: q.goal || '', question: q.q[l], answer: a.answer || '' };
    });

    const payload = {
      // Kept identical to the previous Worker contract:
      name: (contactState.name || '').trim(),
      email: (contactState.email || '').trim(),
      company: (contactState.company || '').trim(),
      honeypot: form.hp_check.value,
      lang: l,
      answers: answerList,
      // New lead-qualification fields:
      persona: persona,
      role: (contactState.role || '').trim(),
      phone: (contactState.phone || '').trim(),
    };

    try {
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('submit failed with status ' + res.status);
      stage = 'success';
      render();
    } catch (e) {
      btn.disabled = false;
      btn.textContent = T.submit[l];
      status.textContent = T.errorBody[l];
      status.classList.add('error');
    }
  }

  render();
  document.addEventListener('i18n:change', () => {
    // Don't wipe a partially-filled contact form on a language switch.
    if (stage === 'form') { saveContact(root.querySelector('#leadForm')); }
    if (stage !== 'success') render();
  });
})();
