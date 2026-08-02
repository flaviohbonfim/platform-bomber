#!/usr/bin/env python3
"""Key out pink background, auto-crop, nearest-neighbor resize to engine sizes."""
from __future__ import annotations

import os
from pathlib import Path

from PIL import Image

SESSION = Path(
    "/Users/flavim/.grok/sessions/"
    "%2FUsers%2Fflavim%2FCode%2Fbomberman-platform/"
    "019fc329-a13e-76f0-b5c1-fcc7975fbcf8/images"
)
OUT = Path(__file__).resolve().parents[1] / "public" / "assets" / "sprites"
RAW = Path(__file__).resolve().parents[1] / "public" / "assets" / "raw"

# Map source files → (out_name, target_w, target_h, is_tile)
# Verified by visual inspection of generated assets.
ASSETS: list[tuple[str, str, int, int, bool]] = [
    ("1.jpg", "player.png", 48, 56, False),
    ("5.jpg", "player-walk.png", 48, 56, False),
    ("3.jpg", "bomb.png", 32, 32, False),
    ("4.jpg", "enemy-ballom.png", 32, 32, False),
    ("2.jpg", "enemy-onil.png", 32, 32, False),
    ("6.jpg", "enemy-dahl.png", 32, 32, False),
    ("10.jpg", "boss-king.png", 64, 64, False),
    ("12.jpg", "soft-block.png", 32, 32, False),
    ("11.jpg", "tile-hard.png", 32, 32, True),  # grass dirt
    ("9.jpg", "tile-hard-brick.png", 32, 32, True),  # bricks
    ("8.jpg", "tile-oneway.png", 48, 24, False),  # platform
    ("7.jpg", "fx-explode.png", 48, 48, False),  # explosion
]


def is_pink(r: int, g: int, b: int) -> bool:
    # Hot pink / magenta key
    if r > 180 and b > 180 and g < 140:
        return True
    if r > 200 and g < 120 and b > 160:
        return True
    # Near pure magenta
    if abs(r - 255) < 40 and abs(b - 255) < 40 and g < 100:
        return True
    return False


def key_and_crop(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_pink(r, g, b):
                px[x, y] = (0, 0, 0, 0)

    # Auto-crop to non-transparent content
    bbox = im.getbbox()
    if bbox:
        # pad a little
        x0, y0, x1, y1 = bbox
        pad = 2
        x0 = max(0, x0 - pad)
        y0 = max(0, y0 - pad)
        x1 = min(w, x1 + pad)
        y1 = min(h, y1 + pad)
        im = im.crop((x0, y0, x1, y1))
    return im


def fit_square(im: Image.Image, tw: int, th: int) -> Image.Image:
    """Scale content to fit inside tw×th, centered, transparent padding."""
    im = im.convert("RGBA")
    # Scale preserving aspect
    scale = min(tw / im.width, th / im.height)
    nw = max(1, int(round(im.width * scale)))
    nh = max(1, int(round(im.height * scale)))
    scaled = im.resize((nw, nh), Image.Resampling.NEAREST)
    canvas = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    ox = (tw - nw) // 2
    oy = (th - nh) // 2
    # Prefer bottom-align for characters
    if th > tw * 0.8:  # taller character sprites
        oy = th - nh
    canvas.paste(scaled, (ox, oy), scaled)
    return canvas


def fit_tile(im: Image.Image, size: int) -> Image.Image:
    """Force edge-to-edge tile."""
    im = im.convert("RGBA")
    # For tiles that filled frame, still key pink margins then stretch
    return im.resize((size, size), Image.Resampling.NEAREST)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    RAW.mkdir(parents=True, exist_ok=True)

    # Re-map after verifying tiles - open 7,8,9,11,12 for classification
    # We'll process all ASSETS as listed; user can re-run after fix.

    for src_name, out_name, tw, th, is_tile in ASSETS:
        src = SESSION / src_name
        if not src.exists():
            print("MISSING", src)
            continue
        im = Image.open(src)
        # save raw copy
        im.save(RAW / src_name.replace(".jpg", ".png"))
        keyed = key_and_crop(im)
        if is_tile:
            # For tiles: if mostly full frame, resize whole image first after mild key
            full = im.convert("RGBA")
            px = full.load()
            w, h = full.size
            for y in range(h):
                for x in range(w):
                    r, g, b, a = px[x, y]
                    if is_pink(r, g, b):
                        px[x, y] = (0, 0, 0, 0)
            # If almost no transparency (tile filled frame), use full resize
            alpha = full.split()[3]
            if alpha.getextrema()[0] > 200:
                out = full.resize((tw, th), Image.Resampling.NEAREST)
            else:
                out = keyed.resize((tw, th), Image.Resampling.NEAREST)
        else:
            out = fit_square(keyed, tw, th)
        out_path = OUT / out_name
        out.save(out_path, "PNG")
        print(f"OK {out_name} {out.size}")


if __name__ == "__main__":
    main()
