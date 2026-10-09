"""Automatic background-removal (cutout) generation for product photos.

Every time the catalog reloads (startup or price.xlsx change) any product
whose transparent WebP cutout is missing gets one generated with rembg
(u2net) in a background thread: trimmed to the alpha bounding box, scaled
to max 900px, saved as data/cutouts/<id>.webp (quality 86).

Cutouts are served statically from /cutouts by main.py and listed via
GET /api/cutouts, so new products pick up transparent photos automatically.
"""
from __future__ import annotations

import logging
import threading
from pathlib import Path

from .config import settings
from .models import Product

logger = logging.getLogger("cutouts")

BAD_ID_CHARS = set('\\/:*?"<>|')
MAX_SIDE = 900

_session = None
_session_lock = threading.Lock()
_gen_lock = threading.Lock()


def cutouts_dir() -> Path:
    if settings.cutouts_dir:
        return Path(settings.cutouts_dir)
    return Path(settings.images_dir).parent / "cutouts"


def cutout_name(product_id: str) -> str:
    # ids may contain characters that are illegal in file names (e.g. "700\703...")
    return "".join("_" if c in BAD_ID_CHARS else c for c in product_id)


def _source_image(product: Product) -> Path | None:
    if not product.has_image:
        return None
    name = Path(product.image.replace("\\", "/")).name
    if not name or name.lower().endswith(".svg"):
        return None
    src = Path(settings.images_dir) / name
    return src if src.exists() else None


def generate_missing(products) -> None:
    """Create WebP cutouts for every product that does not have one yet."""
    if not _gen_lock.acquire(blocking=True):
        return
    try:
        out = cutouts_dir()
        out.mkdir(parents=True, exist_ok=True)
        todo: list[tuple[Product, Path]] = []
        for p in products:
            if (out / f"{cutout_name(p.id)}.webp").exists():
                continue
            src = _source_image(p)
            if src is not None:
                todo.append((p, src))
        if not todo:
            return
        logger.info("Generating %d missing cutout(s)", len(todo))
        # heavy imports only when there is actually work to do
        from PIL import Image
        from rembg import new_session, remove

        global _session
        with _session_lock:
            if _session is None:
                _session = new_session("u2net")
        for p, src in todo:
            try:
                with Image.open(src) as im:
                    cut = remove(im.convert("RGBA"), session=_session)
                bbox = cut.split()[3].point(lambda a: 255 if a > 8 else 0).getbbox()
                if bbox:
                    cut = cut.crop(bbox)
                w, h = cut.size
                scale = MAX_SIDE / max(w, h)
                if scale < 1:
                    cut = cut.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
                tmp = out / f".{cutout_name(p.id)}.webp.tmp"
                cut.save(tmp, "WEBP", quality=86, method=6)
                tmp.replace(out / f"{cutout_name(p.id)}.webp")
                logger.info("Cutout generated for %s (%s)", p.id, p.name_uk)
            except Exception:  # noqa: BLE001
                logger.exception("Cutout generation failed for %s", p.id)
    except Exception:  # noqa: BLE001
        logger.exception("Background removal is unavailable")
    finally:
        _gen_lock.release()


def schedule_generate(products) -> None:
    """Kick generation off in a background thread (store on_reload callback)."""
    snapshot = list(products)
    threading.Thread(
        target=generate_missing, args=(snapshot,), name="cutout-generation", daemon=True
    ).start()
