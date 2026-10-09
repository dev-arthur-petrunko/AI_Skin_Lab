"""Generate transparent-background WebP cutouts for every catalog product.

Reads the live catalog from the backend, runs rembg (u2net) over each
source image and writes data/cutouts/<id>.webp (trimmed, max 900px,
quality 86). Existing cutouts are skipped, so the script is safe to
re-run / resume. Normally the backend generates cutouts automatically
(app/cutouts.py); this script is a manual backfill helper.

Usage:  python backend/scripts/make_cutouts.py [--limit N]
"""
from __future__ import annotations

import io
import json
import sys
import urllib.request
from pathlib import Path

from PIL import Image
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parents[2]
IMAGES = ROOT / "data" / "images"
OUT = ROOT / "data" / "cutouts"
API = "http://localhost:8000/api/catalog"
MAX_SIDE = 900

# ids may contain characters that are illegal in file names (e.g. "700\703...")
BAD_ID_CHARS = set('\\/:*?"<>|')


def cutout_name(pid: str) -> str:
    return "".join("_" if c in BAD_ID_CHARS else c for c in pid)


def main() -> None:
    limit = 0
    if "--limit" in sys.argv:
        limit = int(sys.argv[sys.argv.index("--limit") + 1])

    OUT.mkdir(parents=True, exist_ok=True)
    catalog = json.loads(urllib.request.urlopen(API, timeout=15).read().decode())
    items = catalog["items"]

    session = new_session("u2net")
    done = skipped = failed = 0
    for n, p in enumerate(items, 1):
        pid = p["id"]
        out_path = OUT / f"{cutout_name(pid)}.webp"
        if out_path.exists():
            skipped += 1
            continue
        if limit and done >= limit:
            break
        src = IMAGES / Path(p["image"].replace("\\", "/")).name
        if not src.exists() or src.suffix.lower() == ".svg":
            print(f"[{n}/{len(items)}] {pid}: no usable source ({src.name})")
            failed += 1
            continue
        try:
            with Image.open(src) as im:
                im = im.convert("RGBA")
                cut = remove(im, session=session)
            bbox = cut.split()[3].point(lambda a: 255 if a > 8 else 0).getbbox()
            if bbox:
                cut = cut.crop(bbox)
            w, h = cut.size
            scale = MAX_SIDE / max(w, h)
            if scale < 1:
                cut = cut.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
            cut.save(out_path, "WEBP", quality=86, method=6)
            done += 1
            print(f"[{n}/{len(items)}] {pid}: ok {cut.size[0]}x{cut.size[1]}")
        except Exception as exc:  # noqa: BLE001
            failed += 1
            print(f"[{n}/{len(items)}] {pid}: FAILED {exc}")

    print(f"done={done} skipped_existing={skipped} failed={failed}")


if __name__ == "__main__":
    main()
