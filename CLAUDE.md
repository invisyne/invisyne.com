# CLAUDE.md — invisyne.com

Public website for Invisyne. Served via GitHub Pages from the `main` branch.

## Important

This is a **public repository**. Do not commit anything that is not intended for the public web — no internal docs, no secrets, no private brand assets beyond what is already here.

## Stack

- HTML/CSS/JS with **no build step**. Libraries are vendored (not bundled) under `js/vendor/`: GSAP + ScrollTrigger, Three.js, Lenis. No CDN at runtime.
- Background is a procedural Three.js "cinematic spine" (`js/cinema/`) driven by scroll via Lenis + ScrollTrigger; reveals via GSAP. Falls back to a static brand gradient under `prefers-reduced-motion` or when WebGL is unavailable. The retired 2D canvas lives in git history (`js/scene.js`).
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
