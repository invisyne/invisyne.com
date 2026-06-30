/* =====================================================================
   INVISYNE — Industrial Self-Assessment
   A short yes/no maturity quiz. Bilingual (reads window.INVISYNE_LANG),
   re-renders on language change. Self-contained; renders into #assessment.
   ===================================================================== */
(() => {
  'use strict';
  const root = document.getElementById('assessment');
  if (!root) return;

  // [EN, DE]
  const Q = [
    ['Can you monitor your assets live from anywhere?',      'Können Sie Ihre Anlagen live von überall überwachen?'],
    ['Can you compare machines with each other?',            'Können Sie Maschinen miteinander vergleichen?'],
    ['Do you have a baseline for each machine?',             'Haben Sie eine Baseline jeder Maschine?'],
    ['Do you know each machine’s last known-good state?',    'Kennen Sie den letzten bekannten Gutzustand jeder Maschine?'],
    ['Are root causes provable within minutes?',             'Sind Ursachen innerhalb weniger Minuten nachweisbar?'],
    ['Does machine knowledge stay with the company?',        'Bleibt Maschinenwissen beim Unternehmen?'],
    ['Is your service reproducible?',                        'Ist Ihr Service reproduzierbar?'],
    ['Can you analyse historical states freely?',            'Können Sie historische Zustände beliebig analysieren?'],
    ['Is machine data captured continuously, not just sampled?', 'Werden Maschinendaten kontinuierlich erfasst, nicht nur stichprobenartig?'],
    ['Can you detect deviations before they cause downtime?', 'Erkennen Sie Abweichungen, bevor sie zu Stillstand führen?'],
    ['Do you already use data for product improvements?',    'Nutzen Sie Daten bereits für Produktverbesserungen?'],
    ['Are you using AI tools to systematically analyse data and derive actions from it?', 'Nutzen Sie KI-Tools, um Daten systematisch zu analysieren und Maßnahmen abzuleiten?'],
  ];

  // Four maturity levels (low → high). name + short description [EN, DE]
  const LEVELS = [
    { name: ['Emerging', 'Emerging'],
      desc: ['Data exists, but behaviour is hard to compare or trace. A pilot can establish your first baseline.',
             'Daten sind vorhanden, aber Verhalten ist schwer vergleichbar oder nachvollziehbar. Ein Pilot schafft Ihre erste Baseline.'] },
    { name: ['Developing', 'Developing'],
      desc: ['You have the building blocks. Continuous memory and context would unlock much faster answers.',
             'Sie haben die Bausteine. Kontinuierliches Gedächtnis und Kontext liefern deutlich schnellere Antworten.'] },
    { name: ['Advanced', 'Advanced'],
      desc: ['Strong foundations. You are ready to scale comparison, root-cause, and service across the fleet.',
             'Starke Grundlagen. Sie sind bereit, Vergleich, Ursachenanalyse und Service über die Flotte zu skalieren.'] },
    { name: ['Operational Intelligence Ready', 'Operational Intelligence Ready'],
      desc: ['You already operate on machine intelligence. Invisyne helps you turn it into new service and product value.',
             'Sie arbeiten bereits mit Maschinenintelligenz. Invisyne hilft, daraus neuen Service- und Produktwert zu schaffen.'] },
  ];

  const T = {
    yes:    ['Yes', 'Ja'],
    no:     ['No', 'Nein'],
    q:      ['Question', 'Frage'],
    of:     ['of', 'von'],
    result: ['Your maturity level', 'Ihr Reifegrad'],
    score:  ['You answered “yes” to', 'Sie haben „Ja“ beantwortet bei'],
    outof:  ['of', 'von'],
    restart:['Start over', 'Neu starten'],
    pilot:  ['Request a pilot', 'Pilot anfragen'],
  };

  const PILOT_HREF = 'mailto:info@invisyne.com?subject=Invisyne%20pilot%20request&body=Hi%20Invisyne%20team%2C%0D%0A%0D%0AWe%27d%20like%20to%20run%20a%20pilot.%0D%0A%0D%0ACompany%3A%0D%0AMachine%20%2F%20line%3A%0D%0AGoal%3A%0D%0A';

  let idx = 0, score = 0, done = false;
  const L = () => ((window.INVISYNE_LANG || document.documentElement.lang) === 'de' ? 1 : 0);
  const levelFor = (s) => { const r = s / Q.length; return r < 0.3 ? 0 : r < 0.6 ? 1 : r < 0.85 ? 2 : 3; };

  function render() {
    const l = L();
    if (!done) {
      const pct = Math.round((idx / Q.length) * 100);
      root.innerHTML =
        '<p class="assess-progress">' + T.q[l] + ' ' + (idx + 1) + ' ' + T.of[l] + ' ' + Q.length + '</p>' +
        '<div class="assess-bar"><span style="width:' + pct + '%"></span></div>' +
        '<p class="assess-q">' + Q[idx][l] + '</p>' +
        '<div class="assess-actions">' +
          '<button class="btn btn-primary" data-ans="1">' + T.yes[l] + '</button>' +
          '<button class="btn btn-ghost" data-ans="0">' + T.no[l] + '</button>' +
        '</div>';
      root.querySelectorAll('[data-ans]').forEach((b) =>
        b.addEventListener('click', () => { if (b.dataset.ans === '1') score++; idx++; if (idx >= Q.length) done = true; render(); })
      );
    } else {
      const li = levelFor(score);
      const scale = LEVELS.map((lv, k) =>
        '<span class="' + (k === li ? 'on' : '') + '">' + lv.name[l] + '</span>').join('');
      root.innerHTML =
        '<div class="assess-result">' +
          '<p class="assess-progress">' + T.result[l] + '</p>' +
          '<p class="level grad-text">' + LEVELS[li].name[l] + '</p>' +
          '<p class="lede">' + LEVELS[li].desc[l] + '</p>' +
          '<div class="assess-scale">' + scale + '</div>' +
          '<p class="assess-progress">' + T.score[l] + ' ' + score + ' ' + T.outof[l] + ' ' + Q.length + '</p>' +
          '<div class="assess-actions" style="margin-top:1.4rem">' +
            '<a class="btn btn-primary" href="' + PILOT_HREF + '">' + T.pilot[l] + '</a>' +
            '<button class="btn btn-ghost" data-restart>' + T.restart[l] + '</button>' +
          '</div>' +
        '</div>';
      const r = root.querySelector('[data-restart]');
      if (r) r.addEventListener('click', () => { idx = 0; score = 0; done = false; render(); });
    }
  }

  render();
  document.addEventListener('i18n:change', render);
})();
