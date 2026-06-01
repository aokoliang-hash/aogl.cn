#!/usr/bin/env python3
"""
Generate 16:9 WebP cover thumbnails for article heroImage fields.

Reads data/articles/*.json, crops/resizes source art to 800x450, writes
upload/articles/<slug>.webp, and sets:
  heroImageSource — original path (for regeneration)
  heroImage       — upload/articles/<slug>.webp

Requires: pip install Pillow  (py -3 -m pip install Pillow)

Usage: py -3 scripts/generate-article-covers.py
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Pillow required: py -3 -m pip install Pillow", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "articles"
OUT_DIR = ROOT / "upload" / "articles"

COVER_W = 1200
COVER_H = 675
WEBP_QUALITY = 88
BG_RGB = (10, 15, 20)


def cover_crop_resize(im: Image.Image, tw: int, th: int) -> Image.Image:
    w, h = im.size
    target_ratio = tw / th
    src_ratio = w / h
    if src_ratio > target_ratio:
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        box = (left, 0, left + new_w, h)
    else:
        new_h = int(w / target_ratio)
        top = (h - new_h) // 2
        box = (0, top, w, top + new_h)
    cropped = im.crop(box)
    return cropped.resize((tw, th), Image.Resampling.LANCZOS)


def to_rgb(im: Image.Image) -> Image.Image:
    if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
        rgba = im.convert("RGBA")
        bg = Image.new("RGBA", rgba.size, BG_RGB + (255,))
        bg.alpha_composite(rgba)
        return bg.convert("RGB")
    return im.convert("RGB")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    updated = 0
    for jf in sorted(DATA_DIR.glob("*.json")):
        raw = json.loads(jf.read_text(encoding="utf-8"))
        slug = raw.get("slug")
        if not slug:
            continue
        src_rel = (raw.get("heroImageSource") or raw.get("heroImage") or "").strip()
        if not src_rel or src_rel == "og-default.png":
            print(f"skip {slug}: no hero source")
            continue
        if src_rel.startswith("upload/"):
            print(f"skip {slug}: heroImageSource must point at original/, not upload/")
            continue
        src_path = ROOT / src_rel.replace("/", os.sep)
        if not src_path.is_file():
            print(f"WARN {slug}: missing {src_path}", file=sys.stderr)
            continue

        out_rel = f"upload/articles/{slug}.webp"
        out_path = ROOT / out_rel.replace("/", os.sep)

        with Image.open(src_path) as im:
            out_im = cover_crop_resize(to_rgb(im), COVER_W, COVER_H)
            out_im.save(out_path, "WEBP", quality=WEBP_QUALITY, method=6)

        kb = out_path.stat().st_size / 1024
        raw["heroImageSource"] = src_rel.replace("\\", "/")
        raw["heroImage"] = out_rel
        jf.write_text(json.dumps(raw, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"OK {slug}: {src_rel} -> {out_rel} ({kb:.1f} KiB)")
        updated += 1

    print(f"\nDone. {updated} cover(s) in upload/articles/")


if __name__ == "__main__":
    main()
