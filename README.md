# invisyne.com

Public website for [Invisyne](https://invisyne.com) — served via GitHub Pages.

## Status

Coming soon placeholder. The full site is in development.

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

## GitHub Pages

The `CNAME` file sets the custom domain to `invisyne.com`. GitHub Pages is configured to deploy from the `main` branch root.
