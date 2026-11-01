# Branding assets

## Provenance

| | |
| --- | --- |
| Source | [`peterkarlhuber/axentra`](https://github.com/peterkarlhuber/axentra) `assets/branding/axentra-logo.png` |
| Commit | `1c5974594168bd1eb1430e41e7e4802a205ede64` (git blob `d82648e04ab1285e09543db031467133b70f767f`) |
| Owner | Same owner as this repository |
| License | MIT (see `LICENSE` in both repositories) |

`axentra-logo.png` is a byte-identical copy of the original (1254 × 433 px, white background).
Do not edit it. All other files are derived from it with
[`scripts/derive-branding.py`](../../scripts/derive-branding.py) (Python 3 with Pillow), which
reproduces them byte for byte:

```bash
python3 scripts/derive-branding.py          # rewrites public/branding/* and the favicons
```

## Files

| File | Size | Use |
| --- | --- | --- |
| `axentra-logo.png` | 1254 × 433 | Original lockup on white. Reference only. |
| `axentra-logo-transparent.png` | 627 × 217 | Lockup with the white background knocked out; for light surfaces (login, setup). |
| `axentra-logo-on-dark.png` | 627 × 217 | Same, with the navy wordmark recoloured to `#F1F4FF`; for dark surfaces (login in dark theme). |
| `axentra-mark.png` | 512 × 512 | Square hexagon mark, transparent. |
| `axentra-mark-192.png` | 192 × 192 | Splash screen and large icons. |
| `axentra-mark-64.png` | 64 × 64 | Sidebar mark (rendered at 32 px for high-density screens). |
| `../favicon.ico` | 16–64 | Browser tab icon. |
| `../apple-touch-icon.png` | 180 × 180 | Home-screen icon on a white tile. |

## How the derivation works

1. **Background knockout.** For each pixel, the darkest channel decides the alpha: at or above
   246 the pixel becomes fully transparent, at or below 170 it stays opaque, and in between it
   gets proportional alpha and its colour is "un-mixed" from white. This keeps the anti-aliased
   edges coloured instead of leaving a grey halo on dark backgrounds.
2. **Mark.** The hexagon icon is cropped (x 78–431, y 19–413), centred on a square canvas with a
   12 px margin and resized.
3. **On-dark lockup.** Everything right of x = 470 (the "Axentra" wordmark) is recoloured to the
   light text colour; the icon keeps its original gradient colours, which have enough contrast
   on the navy sidebar.

The sidebar does not use the bitmap wordmark: it shows the mark next to "Axentra" set in the
display font, so the text stays crisp at every zoom level and follows the theme tokens.
