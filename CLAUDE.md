# CLAUDE.md — invisyne.com

Public website for Invisyne. Served via GitHub Pages from the `main` branch.

## Important

This is a **public repository**. Do not commit anything that is not intended for the public web — no internal docs, no secrets, no private brand assets beyond what is already here.

## Stack

- HTML/CSS/JS with **no build step**. Libraries are vendored (not bundled) under `js/vendor/`: GSAP + ScrollTrigger, Lenis. No CDN at runtime.
- Background is a hand-rolled 2D-canvas animation (`js/scene.js`): a drifting node network plus a centered multi-line signal chart with threshold "incident" markers and an abstract asset-lifecycle ribbon. It self-handles `prefers-reduced-motion` (static frame).
- Motion layer (`js/cinema/`): GSAP/ScrollTrigger scroll-reveals (staggered headlines, glass float-in) plus Lenis snappy smooth-scroll, gated behind `prefers-reduced-motion`. Brand tokens read from CSS in `js/cinema/config.js`.
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
