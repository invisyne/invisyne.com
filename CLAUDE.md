# CLAUDE.md — invisyne.com

Public website for Invisyne. Served via GitHub Pages from the `main` branch.

## Important

This is a **public repository**. Do not commit anything that is not intended for the public web — no internal docs, no secrets, no private brand assets beyond what is already here.

`.gitignore` enforces this for known-sensitive local paths — never remove these entries just to "clean up," and don't recreate/commit their contents elsewhere in the repo:
- `docs/superpowers/` — internal design specs
- `js/V1/`, `js/V5/` — internal/IP-sensitive work-in-progress implementations
- `SITEMAP.md` — internal planning doc
- `.obsidian/` — editor workspace

If a sensitive file is ever committed by mistake, adding it to `.gitignore` only stops *future* commits — it stays visible in git history on the public repo until the history itself is rewritten (and force-pushed). Flag this to the user rather than assuming a later removal commit is sufficient.

## Stack

- HTML/CSS/JS with **no build step**. Libraries are vendored (not bundled) under `js/vendor/`: GSAP + ScrollTrigger, Lenis. No CDN at runtime.
- Multipage site (v3): `index.html`, `why.html`, `usecases.html`, `platform.html`, `referenzen.html`, `faq.html`, `latest.html`, `assessment.html`, `data-morph.html`. Header/footer nav is shared via `js/site-chrome.js` (injected on every page) — edit nav links there, not per-page.
- Background is a hand-rolled 2D-canvas animation (`js/scene.js`): a drifting node network plus a centered multi-line signal chart with threshold "incident" markers and an abstract asset-lifecycle ribbon. It self-handles `prefers-reduced-motion` (static frame).
- Motion layer (`js/cinema/`): GSAP/ScrollTrigger scroll-reveals (staggered headlines, glass float-in) plus Lenis snappy smooth-scroll, gated behind `prefers-reduced-motion`. Brand tokens read from CSS in `js/cinema/config.js`.
- i18n (EN/DE): `js/i18n.js` switches text via `data-i18n` attributes; English is the DOM source of truth, German strings live in `js/translations.de.js` (`window.INVISYNE_DE`). No build step, no routing — same URL, swapped text.
- Dark/light theme: `js/theme.js` toggles `data-theme` on `<html>`, persisted in `localStorage`. CSS tokens for light mode live under `html[data-theme="light"]` in `css/main.css`. Inline script in each page's `<head>` sets the theme before first paint to avoid a flash.
- GT America Extended font, self-hosted as woff2 in `assets/fonts/`
- Brand tokens defined as CSS custom properties in `css/main.css`

## Brand assets

Sourced from the internal `handbook` repo (`brand/` directory). Do not modify logos, fonts, or tokens directly — update the handbook and copy the relevant files here.

Key paths in handbook:
- Colors/tokens: `brand/tokens/tokens.css`
- Fonts: `brand/fonts/`
- Logos: `brand/logos/invisyne/`
- Favicons: `brand/favicons/invisyne/`

## Local dev

```bash
python3 -m http.server 8080
```

## Deployment

Push to `main`. GitHub Pages deploys automatically. Custom domain is set via the `CNAME` file (`invisyne.com`).
