#!/usr/bin/env python3
"""Bomberman-inspired HQ sprite pipeline: key magenta, crop, nearest scale, sheets."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

SESSION = Path(
    "/Users/flavim/.grok/sessions/"
    "%2FUsers%2Fflavim%2FCode%2Fbomberman-platform/"
    "019fc329-a13e-76f0-b5c1-fcc7975fbcf8/images"
)
OUT = Path(__file__).resolve().parents[1] / "public" / "assets" / "sprites"
RAW = Path(__file__).resolve().parents[1] / "public" / "assets" / "raw"

# Source mapping (verified by generation order + color stats)
MAP: dict[str, str] = {
    "player-idle": "13.jpg",
    "player-w1": "18.jpg",
    "player-w2": "17.jpg",
    "player-w3": "16.jpg",
    "player-jump": "19.jpg",
    "player-throw": "22.jpg",
    "bomb": "15.jpg",
    "enemy-ballom": "14.jpg",
    "enemy-onil": "24.jpg",
    "enemy-dahl": "21.jpg",
    "soft-block": "25.jpg",
    "tile-hard": "20.jpg",
    "boss-king": "23.jpg",
}

SIZES: dict[str, tuple[int, int]] = {
    "player-idle": (48, 56),
    "player-w1": (48, 56),
    "player-w2": (48, 56),
    "player-w3": (48, 56),
    "player-jump": (48, 56),
    "player-throw": (48, 56),
    "bomb": (28, 28),
    "enemy-ballom": (36, 36),
    "enemy-onil": (36, 36),
    "enemy-dahl": (36, 36),
    "soft-block": (32, 32),
    "tile-hard": (32, 32),
    "boss-king": (72, 72),
}


def is_magenta(r: int, g: int, b: int) -> bool:
    if r > 170 and b > 170 and g < 150:
        return True
    if r > 200 and g < 130 and b > 180:
        return True
    # hot pink variants
    if r > 210 and 40 < g < 160 and b > 180:
        return True
    return False


def key_crop(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_magenta(r, g, b):
                px[x, y] = (0, 0, 0, 0)
    bbox = im.getbbox()
    if not bbox:
        return im
    x0, y0, x1, y1 = bbox
    pad = 4
    return im.crop(
        (
            max(0, x0 - pad),
            max(0, y0 - pad),
            min(w, x1 + pad),
            min(h, y1 + pad),
        )
    )


def fit(im: Image.Image, tw: int, th: int, bottom_align: bool = True) -> Image.Image:
    im = im.convert("RGBA")
    scale = min(tw / im.width, th / im.height)
    nw = max(1, int(round(im.width * scale)))
    nh = max(1, int(round(im.height * scale)))
    scaled = im.resize((nw, nh), Image.Resampling.NEAREST)
    canvas = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    ox = (tw - nw) // 2
    oy = th - nh if bottom_align else (th - nh) // 2
    canvas.paste(scaled, (ox, oy), scaled)
    return canvas


def force_tile(im: Image.Image, size: int) -> Image.Image:
    """Key + crop then fill square tile."""
    keyed = key_crop(im)
    # For blocks, prefer tight square
    return keyed.resize((size, size), Image.Resampling.NEAREST)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    RAW.mkdir(parents=True, exist_ok=True)
    frames: dict[str, Image.Image] = {}

    for name, src_name in MAP.items():
        src = SESSION / src_name
        if not src.exists():
            print("MISSING", src)
            continue
        raw = Image.open(src)
        raw.save(RAW / f"{name}.png")
        tw, th = SIZES[name]
        if name.startswith("tile") or name == "soft-block":
            out = force_tile(raw, tw)
        else:
            out = fit(key_crop(raw), tw, th, bottom_align=not name.startswith("bomb"))
            if name == "bomb":
                out = fit(key_crop(raw), tw, th, bottom_align=False)
        frames[name] = out
        out.save(OUT / f"{name}.png")
        print("OK", name, out.size)

    # Aliases engine expects
    if "player-idle" in frames:
        frames["player-idle"].save(OUT / "player.png")
    if "player-w1" in frames:
        frames["player-w1"].save(OUT / "player-walk.png")

    # 4-frame walk sheet (horizontal) for Phaser animation
    walk_keys = ["player-w1", "player-w2", "player-w3", "player-idle"]
    if all(k in frames for k in walk_keys):
        fw, fh = 48, 56
        sheet = Image.new("RGBA", (fw * 4, fh), (0, 0, 0, 0))
        for i, k in enumerate(walk_keys):
            sheet.paste(frames[k], (i * fw, 0), frames[k])
        sheet.save(OUT / "player-sheet.png")
        print("OK player-sheet.png", sheet.size)

    # Jump + throw aliases
    if "player-jump" in frames:
        frames["player-jump"].save(OUT / "player-jump.png")
    if "player-throw" in frames:
        frames["player-throw"].save(OUT / "player-throw.png")

    # Theme tile variants from hard block
    if "tile-hard" in frames:
        hard = frames["tile-hard"]
        hard.save(OUT / "tile-hard.png")

        # Brick: warm shift
        brick = hard.copy()
        px = brick.load()
        for y in range(brick.height):
            for x in range(brick.width):
                r, g, b, a = px[x, y]
                if a < 10:
                    continue
                px[x, y] = (
                    min(255, int(r * 1.15 + 30)),
                    min(255, int(g * 0.75 + 10)),
                    min(255, int(b * 0.55)),
                    a,
                )
        brick.save(OUT / "tile-hard-brick.png")

        # Cave: purple/gray
        cave = hard.copy()
        px = cave.load()
        for y in range(cave.height):
            for x in range(cave.width):
                r, g, b, a = px[x, y]
                if a < 10:
                    continue
                px[x, y] = (
                    min(255, int(r * 0.5 + 50)),
                    min(255, int(g * 0.4 + 30)),
                    min(255, int(b * 0.7 + 80)),
                    a,
                )
        cave.save(OUT / "tile-hard-cave.png")
        print("OK theme tiles")

    # Soft block alias
    if "soft-block" in frames:
        frames["soft-block"].save(OUT / "soft-block.png")

    # Simple one-way from soft/hard: green platform strip
    ow = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    for y in range(0, 10):
        for x in range(32):
            shade = 40 + (x % 4) * 8 + y * 6
            ow.putpixel((x, y), (20, min(255, 160 + shade // 3), min(255, 100 + shade // 2), 255))
    # chevrons
    for x in range(2, 30, 6):
        ow.putpixel((x, 4), (180, 255, 200, 255))
        ow.putpixel((x + 1, 5), (180, 255, 200, 255))
    ow.save(OUT / "tile-oneway.png")
    print("OK tile-oneway")

    # Explosion keep previous or simple
    # Reuse classic fire circle if no new FX
    if not (OUT / "fx-explode.png").exists():
        fx = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
        # leave; factory will fill

    print("Done →", OUT)


if __name__ == "__main__":
    main()
