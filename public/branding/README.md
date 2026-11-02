# Branding assets

## Provenance

| | |
| --- | --- |
| Masters | [`branding-src/axentra-logo-transparent.png`](../../branding-src/axentra-logo-transparent.png) and [`branding-src/axentra-logo-white.png`](../../branding-src/axentra-logo-white.png) |
| Owner | The official Axentra logo, supplied by the brand owner (same owner as this repository) |
| Same masters in | [`peterkarlhuber/axentra`](https://github.com/peterkarlhuber/axentra) `assets/branding/` |
| License | MIT (see `LICENSE` in both repositories) |

The masters are 2048 × 640 px, symbol left, black wordmark right; the white master is the
transparent one flattened on white. They live outside `public/`, so they are not served. Do not
edit them, and never edit a derived file by hand: regenerate it.

All files below are derived from the transparent master by
[`scripts/derive_branding.py`](../../scripts/derive_branding.py), the derivation script shared by
every repository that ships the logo and vendored here unchanged (Python 3 with Pillow and NumPy).
It never redraws the artwork: it defringes the anti-aliased edges, recolors the wordmark to white
for dark surfaces, trims, pads and resamples.

## Regenerate

```bash
python3 scripts/derive_branding.py --product axentra --masters branding-src --check
python3 scripts/derive_branding.py --product axentra --masters branding-src \
  --out public/branding --favicon-out public --sets web,favicons
# Keep the served name of the light lockup (used by the Logo component and links elsewhere).
mv public/branding/axentra-logo.png public/branding/axentra-logo-transparent.png
# Web-app icons: Studio has no web app manifest, so these are not used.
rm public/icon-192.png public/icon-512.png public/icon-maskable-512.png
```

## Files

| File | Size | Use |
| --- | --- | --- |
| `axentra-logo-transparent.png` | 960 × 238 | Lockup with black wordmark (the script's `axentra-logo.png`), for light surfaces: sign-in, setup and public help pages in the light theme. |
| `axentra-logo-on-dark.png` | 960 × 238 | Lockup with white wordmark, for dark surfaces: those pages in the dark theme and the navy sidebar (both themes). |
| `axentra-mark.png` | 512 × 512 | Symbol only, transparent; loading screen. Same file on light and dark surfaces. |
| `axentra-mark-128.png` | 128 × 128 | Symbol for small sizes; collapsed sidebar (32 px). |
| `../favicon.ico` | 16, 32, 48 | Browser tab icon. |
| `../favicon-16.png`, `../favicon-32.png` | 16, 32 | PNG tab icons (linked in `index.html`). |
| `../apple-touch-icon.png` | 180 × 180 | Home-screen icon on an opaque white tile. |

`src/components/layout/Logo.tsx` is the only place that picks one of these files. It follows the
`data-theme` attribute on `<html>` for the lockup; the collapsed sidebar and the loading screen use
the symbol.
