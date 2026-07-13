/* =====================================================================
   INVISYNE — Lead-qualification questionnaire (content, EN/DE)
   Edit this file to change questions — the engine (js/questionnaire.js)
   needs no changes. Hidden page, sent as a direct link after first contact.

   Principles
   ----------
   - Ask about the CUSTOMER — their situation, pain points and goals.
     Never phrase questions around Invisyne or its features.
   - No yes/no questions, and never require a written sentence. Everything
     is multiple-choice; free text is only ever OPTIONAL (an "other" entry
     on a multi-select, or one optional open question).
   - The pain list below is derived from the public self-assessment
     (js/assessment.js) — the same topics, reframed from capability
     checks into the customer's own words.

   Model
   -----
   - personas[]      : the routing gate (OEM / Operator / Both)
   - shared[]        : questions asked to everyone
   - byPersona{}     : extra questions per persona
   - contact{}       : the final lead-capture fields

   Each question: { id, type, goal, q:{en,de}, ... }
     type  : 'single' | 'multi' | 'text'
     goal  : 'need' | 'authority' | 'budget' | 'timeline' | 'fit'  (BANT tag,
             carried into the email so sales sees which signal each answer maps to)
     options[] (single/multi): { id, en, de }
     allowOther (multi)      : adds an optional free-text "Other" entry
     placeholder (text)      : {en,de}
     optional (text)         : true → not required (all free text should set this)
   ===================================================================== */
(() => {
  // Reused option sets — kept in one place so personas stay consistent.
  // Customer-facing PLC brands; everything else is captured via OPC UA.
  const PLC_BRANDS = [
    { id: 'siemens', en: 'Siemens (S7 / TIA)', de: 'Siemens (S7 / TIA)' },
    { id: 'rockwell', en: 'Rockwell / Allen-Bradley', de: 'Rockwell / Allen-Bradley' },
    { id: 'beckhoff', en: 'Beckhoff', de: 'Beckhoff' },
    { id: 'mitsubishi', en: 'Mitsubishi', de: 'Mitsubishi' },
    { id: 'opcua', en: 'Others (via OPC UA)', de: 'Andere (über OPC UA)' },
    { id: 'mixed', en: 'Mixed / not sure', de: 'Gemischt / unklar' },
  ];
  const SCALE = [
    { id: 'lt10', en: 'Under 10', de: 'Unter 10' },
    { id: '10-50', en: '10–50', de: '10–50' },
    { id: '50-200', en: '50–200', de: '50–200' },
    { id: '200+', en: '200+', de: '200+' },
  ];
  // Industry segments — grounded in the ICP market map
  // (PM_handbook 13_Invisyne_Market_Segmentation_DACH_US). These verticals
  // score ICP fit and route the lead to the right sales narrative
  // (O&G / Hydrogen / Sondermaschinenbau / Life-sciences playbooks).
  const SEGMENTS = [
    { id: 'energy', en: 'Energy & power (hydrogen, storage, heat pumps, gensets, turbines)', de: 'Energie & Kraft (Wasserstoff, Speicher, Wärmepumpen, Gensets, Turbinen)' },
    { id: 'oilgas', en: 'Oil, gas & chemical process', de: 'Öl, Gas & chemische Prozesse' },
    { id: 'process', en: 'Process equipment (furnaces, compressors, dosing, vacuum)', de: 'Prozesstechnik (Öfen, Kompressoren, Dosier-, Vakuumtechnik)' },
    { id: 'special', en: 'Special-purpose & assembly machinery', de: 'Sondermaschinen- & Montageanlagen' },
    { id: 'forming', en: 'Forming, pressing & plastics processing', de: 'Umform-, Press- & Kunststofftechnik' },
    { id: 'test', en: 'Test, measurement & end-of-line systems', de: 'Prüf-, Mess- & End-of-Line-Systeme' },
    { id: 'lifesci', en: 'Life sciences & pharma (bioreactors, filling, freeze-drying)', de: 'Life Sciences & Pharma (Bioreaktoren, Abfüllung, Gefriertrocknung)' },
    { id: 'semi', en: 'Semiconductor & electronics manufacturing', de: 'Halbleiter- & Elektronikfertigung' },
  ];
  const SERVICES = [
    { id: 'already', en: 'We already offer them', de: 'Bieten wir bereits an' },
    { id: 'planning', en: "It's on our roadmap", de: 'Steht auf unserer Roadmap' },
    { id: 'notyet', en: 'Not yet, but interested', de: 'Noch nicht, aber interessiert' },
    { id: 'no', en: 'Not a focus right now', de: 'Aktuell kein Schwerpunkt' },
  ];

  window.INVISYNE_QUESTIONNAIRE = {
    /* ---- Persona gate (routing; also settable via ?p=oem|operator|both) ---- */
    gate: {
      q: { en: 'Which best describes your organization?', de: 'Was beschreibt Ihr Unternehmen am besten?' },
    },
    personas: [
      { id: 'oem', en: 'We build & sell machines (OEM)', de: 'Wir bauen & verkaufen Maschinen (OEM)' },
      { id: 'operator', en: 'We operate machines / plants', de: 'Wir betreiben Maschinen / Anlagen' },
      { id: 'both', en: 'Both — we build machines and run our own fleet', de: 'Beides — wir bauen Maschinen und betreiben eine eigene Flotte' },
    ],

    /* ---- Shared questions (everyone) ---- */
    shared: [
      {
        // Pain picker — reframed from the self-assessment topics, in the customer's words.
        id: 'challenges', type: 'multi', goal: 'need', allowOther: true,
        q: { en: 'Which of these sound familiar in your day-to-day?', de: 'Was davon kennen Sie aus Ihrem Alltag?' },
        hint: { en: 'Select all that apply.', de: 'Mehrfachauswahl möglich.' },
        options: [
          { id: 'visibility', en: "We can't see what our machines are doing live, or from anywhere", de: 'Wir sehen nicht live oder von überall, was unsere Maschinen tun' },
          { id: 'troubleshoot', en: 'Troubleshooting is slow — root causes are hard to prove', de: 'Fehlersuche ist langsam — Ursachen sind schwer nachzuweisen' },
          { id: 'downtime', en: 'Unplanned downtime catches us by surprise', de: 'Ungeplanter Stillstand trifft uns unvorbereitet' },
          { id: 'compare', en: "We can't easily compare machines or runs against each other", de: 'Wir können Maschinen oder Läufe nicht einfach vergleichen' },
          { id: 'knowledge', en: 'Machine know-how sits with a few people', de: 'Maschinen-Know-how hängt an wenigen Personen' },
          { id: 'continuous', en: 'We only sample data occasionally, not continuously', de: 'Wir erfassen Daten nur stichprobenartig, nicht kontinuierlich' },
          { id: 'newvalue', en: "We don't yet turn machine data into better products or services", de: 'Wir machen aus Maschinendaten noch keine besseren Produkte oder Services' },
        ],
      },
      {
        id: 'priority', type: 'single', goal: 'need',
        q: { en: 'Of those, which matters most right now?', de: 'Was davon ist Ihnen aktuell am wichtigsten?' },
        options: [
          { id: 'visibility', en: 'Seeing our machines live, from anywhere', de: 'Maschinen live sehen, von überall' },
          { id: 'troubleshoot', en: 'Finding root causes faster', de: 'Ursachen schneller finden' },
          { id: 'downtime', en: 'Avoiding unplanned downtime', de: 'Ungeplanten Stillstand vermeiden' },
          { id: 'compare', en: 'Comparing machines and runs', de: 'Maschinen und Läufe vergleichen' },
          { id: 'knowledge', en: 'Keeping machine know-how in the company', de: 'Maschinenwissen im Unternehmen halten' },
          { id: 'newvalue', en: 'Turning data into new products or services', de: 'Aus Daten neue Produkte oder Services machen' },
        ],
      },
      {
        // Industry segment — the ICP "worthful addon". Scores fit and routes
        // the lead to the matching sales narrative.
        id: 'segment', type: 'multi', goal: 'fit', allowOther: true,
        q: { en: 'Which of these best describe your machines or plant?', de: 'Was beschreibt Ihre Maschinen oder Anlage am besten?' },
        hint: { en: 'Select all that apply.', de: 'Mehrfachauswahl möglich.' },
        options: SEGMENTS,
      },
      {
        id: 'timeline', type: 'single', goal: 'timeline',
        q: { en: 'When would you want to tackle this?', de: 'Wann möchten Sie das angehen?' },
        options: [
          { id: 'now', en: "We're looking into it now / this quarter", de: 'Wir schauen es uns jetzt an / in diesem Quartal' },
          { id: '6mo', en: 'Within the next 6 months', de: 'In den nächsten 6 Monaten' },
          { id: 'year', en: 'Sometime this year', de: 'Irgendwann dieses Jahr' },
          { id: 'explore', en: 'Just getting oriented for now', de: 'Wir orientieren uns nur' },
        ],
      },
      {
        id: 'budget', type: 'single', goal: 'budget',
        q: { en: 'How is this kind of improvement usually funded on your side?', de: 'Wie wird eine solche Verbesserung bei Ihnen üblicherweise finanziert?' },
        options: [
          { id: 'approved', en: 'Budget is available / approved', de: 'Budget ist vorhanden / freigegeben' },
          { id: 'planned', en: 'Budget is planned, not yet approved', de: 'Budget ist geplant, noch nicht freigegeben' },
          { id: 'roi', en: 'It needs a business case / ROI first', de: 'Es braucht zuerst einen Business Case / ROI' },
          { id: 'early', en: 'Too early to say', de: 'Zu früh, um das zu sagen' },
        ],
      },
      {
        // The only open question — always optional.
        id: 'problem_text', type: 'text', goal: 'need', optional: true,
        q: { en: 'Anything you’d like to add, in your own words?', de: 'Möchten Sie noch etwas in eigenen Worten ergänzen?' },
        hint: { en: 'Optional.', de: 'Optional.' },
        placeholder: {
          en: 'e.g. When a line stops we lose hours finding the cause.',
          de: 'z. B. Wenn eine Linie steht, verlieren wir Stunden bei der Ursachensuche.',
        },
      },
    ],

    /* ---- Persona-specific questions (about the customer's own world) ---- */
    byPersona: {
      oem: [
        {
          id: 'oem_volume', type: 'single', goal: 'fit',
          q: { en: 'Roughly how many machines do you ship per year?', de: 'Wie viele Maschinen liefern Sie ungefähr pro Jahr aus?' },
          options: SCALE,
        },
        {
          id: 'oem_services', type: 'single', goal: 'need',
          q: { en: 'How do you think about data-driven services for your customers?', de: 'Wie stehen Sie zu datenbasierten Services für Ihre Kunden?' },
          options: SERVICES,
        },
        {
          id: 'plc', type: 'multi', goal: 'fit',
          q: { en: 'Which PLC brands do your machines use?', de: 'Welche SPS-Marken nutzen Ihre Maschinen?' },
          options: PLC_BRANDS,
        },
      ],
      operator: [
        {
          id: 'op_fleet', type: 'single', goal: 'fit',
          q: { en: 'How many machines or assets are in your fleet?', de: 'Wie viele Maschinen oder Anlagen umfasst Ihre Flotte?' },
          options: SCALE,
        },
        {
          id: 'op_monitor', type: 'single', goal: 'need',
          q: { en: 'How do you keep an eye on your machines today?', de: 'Wie behalten Sie Ihre Maschinen heute im Blick?' },
          options: [
            { id: 'scada', en: 'SCADA / existing dashboards', de: 'SCADA / vorhandene Dashboards' },
            { id: 'remote', en: 'Some remote access, but limited', de: 'Etwas Fernzugriff, aber eingeschränkt' },
            { id: 'manual', en: 'Manual checks / spreadsheets', de: 'Manuelle Kontrollen / Tabellen' },
            { id: 'reactive', en: 'Mostly on-site and reactive', de: 'Überwiegend vor Ort und reaktiv' },
          ],
        },
        {
          id: 'plc', type: 'multi', goal: 'fit',
          q: { en: 'Which PLC brands are on your machines?', de: 'Welche SPS-Marken laufen auf Ihren Maschinen?' },
          options: PLC_BRANDS,
        },
      ],
      both: [
        {
          id: 'both_volume', type: 'single', goal: 'fit',
          q: { en: 'Roughly how many machines do you ship per year?', de: 'Wie viele Maschinen liefern Sie ungefähr pro Jahr aus?' },
          options: SCALE,
        },
        {
          id: 'both_services', type: 'single', goal: 'need',
          q: { en: 'How do you think about data-driven services for your customers?', de: 'Wie stehen Sie zu datenbasierten Services für Ihre Kunden?' },
          options: SERVICES,
        },
        {
          id: 'plc', type: 'multi', goal: 'fit',
          q: { en: 'Which PLC brands do your machines use?', de: 'Welche SPS-Marken nutzen Ihre Maschinen?' },
          options: PLC_BRANDS,
        },
      ],
    },

    /* ---- Final lead-capture block (Authority signal) ---- */
    contact: {
      title: { en: 'Almost done — where should we send the follow-up?', de: 'Fast geschafft — wohin sollen wir uns melden?' },
      fields: [
        { id: 'name', type: 'text', required: true, label: { en: 'Name', de: 'Name' } },
        { id: 'email', type: 'email', required: true, label: { en: 'Work email', de: 'Geschäftliche E-Mail' } },
        { id: 'company', type: 'text', required: true, label: { en: 'Company', de: 'Firma' } },
        {
          id: 'role', type: 'text', required: true, label: { en: 'Your role', de: 'Ihre Rolle' },
          placeholder: { en: 'e.g. Head of Maintenance, CTO, Project Lead', de: 'z. B. Leiter Instandhaltung, CTO, Projektleiter' },
        },
        { id: 'phone', type: 'tel', required: false, label: { en: 'Phone (optional)', de: 'Telefon (optional)' } },
      ],
    },
  };
})();
