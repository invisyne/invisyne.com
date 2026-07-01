# invisyne.com

Public website for [Invisyne](https://invisyne.com) — served via GitHub Pages.

## Status

Live multipage site (v3): home, Why Invisyne, Use Cases, Platform, Customer Stories, FAQ, Latest, and an Industrial Self-Assessment tool. Available in English and German (`js/i18n.js`), dark and light themes (see below).

## Local development

Requires a local HTTP server (the absolute asset paths don't resolve over `file://`):

```bash
python3 -m http.server 8080
# → http://localhost:8080
```

## Assets

Brand assets are sourced from the internal `handbook` repo and committed here:

| Asset | Source |
|---|---|
| Fonts | `handbook/brand/fonts/` (woff2) |
| Favicons | `handbook/brand/favicons/invisyne/` |
| Logo | `handbook/brand/logos/invisyne/invisyne-wordmark-color-neg.svg` |
| Design tokens | `handbook/brand/tokens/tokens.css` |

When the handbook is updated, copy the relevant files to keep this repo in sync.

## Theme (dark/light)

`js/theme.js` toggles `data-theme` on `<html>`; CSS tokens for light mode live under `html[data-theme="light"]` in `css/main.css`. An identical resolver runs inline in each page's `<head>` (before `main.css` loads) to avoid a flash, and again in `js/theme.js` once the DOM is ready.

Initial theme resolves in this order:

1. **Saved choice** — a manual pick via the theme switch, stored in `localStorage` (`invisyne-theme`). Always wins on later visits.
2. **OS preference** — `prefers-color-scheme`. Supported cross-platform (macOS, Windows 10+, Linux desktops) in all current browsers, not just Safari/macOS.
3. **Time of day** — fallback when neither of the above is available: dark from 19:00–07:00 local time (the visitor's own clock/timezone, no geolocation involved), light otherwise.
4. **Dark** — final fallback.

## GitHub Pages

The `CNAME` file sets the custom domain to `invisyne.com`. GitHub Pages is configured to deploy from the `main` branch root.
