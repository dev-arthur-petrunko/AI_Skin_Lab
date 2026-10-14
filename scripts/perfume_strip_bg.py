"""Remove backgrounds from downloaded perfume photos -> data/perfume_images/<sku>.webp.

Input: data/perfume_photos_raw/<sku-basename>.jpg (from perfume_download_photos.py).
Output: local priority-1 catalog data/perfume_images/<sku>.webp (transparent, alpha).
Read-only w.r.t. Excel.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "perfume_photos_raw"
OUT = ROOT / "data" / "perfume_images"
sys.path.insert(0, str(ROOT / "backend"))


def mapping() -> dict[str, str]:
    from app.perfumes.loader import load_products

    products, _ = load_products()
    return {p["sku"]: f"{re.sub(r'[^0-9A-Za-z]+', '', p['sku']).lower()}.jpg" for p in products}


def main() -> int:
    from rembg import new_session, remove

    OUT.mkdir(parents=True, exist_ok=True)
    pairs = mapping()
    if not pairs:
        print("no products from loader", file=sys.stderr)
        return 1

    session = new_session("isnet-general-use")
    ok = skip = fail = 0
    for sku, fname in sorted(pairs.items()):
        src = RAW / fname
        if not src.exists() and fname.endswith(".jpg") and (RAW / f"{fname[:-4]}.png").exists():
            src = RAW / f"{fname[:-4]}.png"
        if not src.exists():
            print(f"[skip] {sku}: raw file missing ({fname})")
            skip += 1
            continue
        dst = OUT / f"{sku}.webp"
        if dst.exists() and dst.stat().st_size > 0:
            skip += 1
            continue
        try:
            with Image.open(src) as im:
                im = im.convert("RGBA")
                if max(im.size) > 1600:
                    im.thumbnail((1600, 1600), Image.LANCZOS)
                out = remove(im, session=session, alpha_matting=False)
                out.save(dst, "WEBP", quality=86, method=4)
            ok += 1
            print(f"[ok] {sku}")
        except Exception as exc:  # noqa: BLE001 - report and continue
            print(f"[fail] {sku}: {exc}", file=sys.stderr)
            fail += 1
    print(f"done: removed={ok} skipped={skip} failed={fail} -> {OUT}")
    return 0 if fail == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
