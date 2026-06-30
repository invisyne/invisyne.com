/* =====================================================================
   INVISYNE — shared site chrome (header + footer)
   Injected on every page so the navigation lives in ONE place.
   Loads BEFORE translations/theme/i18n so their hooks find the nodes.

   Active item: set <body data-page="why|usecases|platform|stories|news|faq|assessment">.
   Dropdowns: open on hover/focus (desktop); shown inline in the mobile drawer.
   Placeholders kept (not rendered): "By Role", "Industries" — enable when they have content.
   ===================================================================== */
(() => {
  'use strict';

  const HEADER = `
  <header class="nav" id="nav">
    <a class="nav-brand" href="/" aria-label="Invisyne — home">
      <img class="theme-logo" src="/assets/logos/invisyne-wordmark-color-neg.svg" alt="Invisyne" width="132">
    </a>
    <button class="nav-toggle" type="button" aria-label="Menu" aria-expanded="false" aria-controls="navLinks">
      <span></span><span></span><span></span>
    </button>
    <nav class="nav-links" id="navLinks" aria-label="Primary">
      <a href="/why.html" data-nav="why" data-i18n="nav.why">Why Invisyne</a>

      <div class="nav-item has-menu" data-nav="usecases">
        <a class="nav-trigger" href="/usecases.html"><span data-i18n="nav.usecases">Use Cases</span><span class="caret" aria-hidden="true">▾</span></a>
        <div class="nav-menu">
          <a href="/usecases.html#commission" data-i18n="uc.commission">Commission &amp; Ramp-Up</a>
          <a href="/usecases.html#operate" data-i18n="uc.operate">Operate &amp; Monitor</a>
          <a href="/usecases.html#maintain" data-i18n="uc.maintain">Maintain &amp; Troubleshoot</a>
          <a href="/usecases.html#improve" data-i18n="uc.improve">Improve Machine Performance</a>
          <a href="/usecases.html#scale" data-i18n="uc.scale">Scale Service Business</a>
        </div>
      </div>

      <!-- Placeholders (no content yet) — enable when ready:
      <a href="/by-role.html" data-nav="role" data-i18n="nav.role">By Role</a>
      <a href="/industries.html" data-nav="industries" data-i18n="nav.industries">Industries</a>
      -->

      <a href="/platform.html" data-nav="platform" data-i18n="nav.platform">Platform</a>
      <a href="/referenzen.html" data-nav="stories" data-i18n="nav.stories">Customer Stories</a>

      <div class="nav-item has-menu" data-nav="resources">
        <button class="nav-trigger" type="button" aria-haspopup="true" aria-expanded="false"><span data-i18n="nav.resources">Resources</span><span class="caret" aria-hidden="true">▾</span></button>
        <div class="nav-menu">
          <a href="/latest.html" data-i18n="res.news">News</a>
          <a href="https://docs.invisyne.com" target="_blank" rel="noopener" data-i18n="res.docs">Documentation ↗</a>
          <a href="/faq.html" data-i18n="res.faq">FAQ</a>
          <a href="/assessment.html" data-i18n="res.assessment">Industrial Self-Assessment</a>
        </div>
      </div>

      <a class="btn btn-primary btn-sm nav-cta" href="https://hub.invisyne.com" target="_blank" rel="noopener" data-i18n="nav.login">Customer Login</a>
      <div class="lang-switch" id="langSwitch" role="group" aria-label="Language">
        <button type="button" data-lang="en">EN</button>
        <button type="button" data-lang="de">DE</button>
      </div>
    </nav>
  </header>`;

  const FOOTER = `
  <footer class="footer" id="imprint">
    <div class="wrap">
      <div class="footer-top">
        <div class="footer-brand">
          <img class="footer-mark theme-logo" src="/assets/logos/invisyne-wordmark-color-neg.svg" alt="Invisyne" width="140">
          <p class="footer-tagline" data-i18n="footer.tagline">Where machine memory becomes operational intelligence.</p>
        </div>
        <div class="imprint">
          <p class="imprint-title" data-i18n="imprint.title">Imprint</p>
          <div class="imprint-cols">
            <address class="imprint-entity">
              <strong><a href="https://www.dr-ecklebe.de" target="_blank" rel="noopener">Dr. Ecklebe GmbH</a></strong>
              Brockenblick 29<br>
              <span data-i18n="imprint.de.city">38855 Wernigerode OT Reddeber, Germany</span><br>
              <span class="imprint-meta">Amtsgericht Stendal · HRB 100778 · VAT&nbsp;DE&nbsp;139575472</span><br>
              <a href="tel:+4939435606 0">+49 (0) 3943 5606 0</a> · <a href="mailto:mail@dr-ecklebe.de">mail@dr-ecklebe.de</a>
            </address>
            <address class="imprint-entity">
              <strong><a href="https://www.ecklebeautomation.com" target="_blank" rel="noopener">ECKLEBE Automation Inc.</a></strong>
              1 Concourse Pkwy, Suite 800<br>
              <span data-i18n="imprint.us.city">Atlanta, GA 30328, USA</span><br>
              <a href="tel:+18328892486">+1 (832) 889-2486</a>
            </address>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="footer-links">
          <a href="/why.html" data-i18n="nav.why">Why Invisyne</a>
          <a href="/usecases.html" data-i18n="nav.usecases">Use Cases</a>
          <a href="/platform.html" data-i18n="nav.platform">Platform</a>
          <a href="/referenzen.html" data-i18n="nav.stories">Customer Stories</a>
          <a href="/latest.html" data-i18n="res.news">News</a>
          <a href="/faq.html" data-i18n="res.faq">FAQ</a>
          <a href="/assessment.html" data-i18n="res.assessment">Industrial Self-Assessment</a>
          <a href="https://docs.invisyne.com" target="_blank" rel="noopener" data-i18n="res.docs">Documentation ↗</a>
        </div>
        <div class="footer-end">
          <div class="theme-switch" id="themeSwitch" role="group" aria-label="Theme">
            <button type="button" data-theme="dark" data-i18n="theme.dark">Dark</button>
            <button type="button" data-theme="light" data-i18n="theme.light">Light</button>
          </div>
          <p class="footer-meta">© 2026 Invisyne · invisyne.com</p>
        </div>
      </div>
    </div>
  </footer>`;

  // Inject: header first in <body>, footer last.
  document.body.insertAdjacentHTML('afterbegin', HEADER);
  document.body.insertAdjacentHTML('beforeend', FOOTER);

  // Active nav item
  const page = document.body.dataset.page;
  if (page) {
    const el = document.querySelector('.nav-links [data-nav="' + page + '"]');
    if (el) {
      const link = el.matches('a') ? el : el.querySelector('a, .nav-trigger');
      (link || el).setAttribute('aria-current', 'page');
      el.classList.add('is-active');
    }
  }

  // Mobile drawer
  const nav = document.getElementById('nav');
  const toggle = nav && nav.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('.nav-links a').forEach((a) =>
      a.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      })
    );
  }
})();
