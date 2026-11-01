#!/usr/bin/env python3
"""Derive the Studio's brand assets from the original Axentra logo.

Reproduces every derived file in public/branding/ (plus public/favicon.ico and
public/apple-touch-icon.png) from public/branding/axentra-logo.png, which is an unmodified
copy of the original. Requires Pillow:

    python3 scripts/derive-branding.py [--out DIR]

Steps:
1. Knock out the white background. Pixels whose darkest channel is >= HI become transparent;
   pixels between LO and HI get partial alpha and are "un-premultiplied" against white so the
   anti-aliased edges keep their colour instead of turning grey on dark surfaces.
2. Crop the hexagon icon (box x 78..431, y 19..413 of the 1254x433 original), centre it on a
   square canvas with a small margin and export the square marks and favicons.
3. Export the full lockup on transparency, and a variant whose wordmark (everything right of
   x = 470) is recoloured to the light text colour #F1F4FF for dark backgrounds.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "public" / "branding" / "axentra-logo.png"
LO, HI = 170, 246
ICON_BOX = (78, 431, 19, 413)  # x0, x1, y0, y1 (inclusive)
WORDMARK_X = 470
ON_DARK_TEXT = (241, 244, 255)
LOCKUP_SIZE = (627, 217)


def knockout(img: Image.Image) -> Image.Image:
    img = img.copy()
    px = img.load()
    width, height = img.size
    for y in range(height):
        for x in range(width):
            r, g, b, _ = px[x, y]
            m = min(r, g, b)
            if m <= LO:
                continue
            if m >= HI:
                px[x, y] = (0, 0, 0, 0)
                continue
            alpha = (HI - m) / (HI - LO)
            divisor = max(alpha, (255 - m) / (255 - LO))

            def unmix(c: int) -> int:
                return max(0, min(255, round(255 - (255 - c) / divisor)))

            px[x, y] = (unmix(r), unmix(g), unmix(b), round(alpha * 255))
    return img


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--source", type=Path, default=SOURCE)
    parser.add_argument("--out", type=Path, default=ROOT / "public")
    args = parser.parse_args()
    branding = args.out / "branding"
    branding.mkdir(parents=True, exist_ok=True)

    transparent = knockout(Image.open(args.source).convert("RGBA"))

    x0, x1, y0, y1 = ICON_BOX
    w, h = x1 - x0 + 1, y1 - y0 + 1
    side = max(w, h) + 24
    mark = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    mark.paste(transparent.crop((x0, y0, x1 + 1, y1 + 1)), ((side - w) // 2, (side - h) // 2))
    for size, name in ((512, "axentra-mark.png"), (192, "axentra-mark-192.png"), (64, "axentra-mark-64.png")):
        mark.resize((size, size), Image.LANCZOS).save(branding / name, optimize=True)
    mark.resize((256, 256), Image.LANCZOS).save(
        args.out / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
    )
    touch = Image.new("RGBA", (180, 180), (255, 255, 255, 255))
    touch.alpha_composite(mark.resize((150, 150), Image.LANCZOS), (15, 15))
    touch.convert("RGB").save(args.out / "apple-touch-icon.png", optimize=True)

    transparent.resize(LOCKUP_SIZE, Image.LANCZOS).save(
        branding / "axentra-logo-transparent.png", optimize=True
    )
    on_dark = transparent.copy()
    px = on_dark.load()
    width, height = on_dark.size
    for y in range(height):
        for x in range(WORDMARK_X, width):
            alpha = px[x, y][3]
            if alpha:
                px[x, y] = (*ON_DARK_TEXT, alpha)
    on_dark.resize(LOCKUP_SIZE, Image.LANCZOS).save(branding / "axentra-logo-on-dark.png", optimize=True)


if __name__ == "__main__":
    main()
