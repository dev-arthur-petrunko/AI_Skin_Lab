"""Perfume image pipeline: local override dir > server download cache > placeholder.

Security: URLs from Excel are untrusted — only http(s), DNS-resolved host must
not be loopback/private/link-local/metadata, max 3 redirects, 10s timeout,
8 MB cap, Content-Type must be image/*.
"""
from __future__ import annotations

import ipaddress
import logging
import os
import re
import socket
import threading
import urllib.request
from io import BytesIO
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

try:  # Pillow is present on the host; the slim container may not have it
    from PIL import Image
except Exception:  # noqa: BLE001
    Image = None  # type: ignore[assignment]

logger = logging.getLogger("perfumes.images")

from .loader import PROJECT_ROOT
LOCAL_DIR = PROJECT_ROOT / "data" / "perfume_images"
CACHE_DIR = PROJECT_ROOT / "data" / "cache" / "perfume_images"
MAX_BYTES = 8 * 1024 * 1024
TIMEOUT = 10
MAX_REDIRECTS = 3
IMG_EXTS = (".png", ".jpg", ".jpeg", ".webp")
_MEDIA_TYPES = {
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
}

_download_lock = threading.Lock()
_pending: set[str] = set()


def _host_allowed(host: str) -> bool:
    try:
        infos = socket.getaddrinfo(host, None)
    except OSError:
        return False
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if (
            ip.is_private or ip.is_loopback or ip.is_link_local
            or ip.is_reserved or ip.is_multicast or ip.is_unspecified
        ):
            return False
        # cloud metadata
        if info[4][0] in ("169.254.169.254", "metadata.google.internal"):
            return False
    return True


def normalize_url(url: str) -> str | None:
    url = (url or "").strip()
    if not url:
        return None
    m = re.search(r"drive\.google\.com/file/d/([-\w]+)", url)
    if m:
        return f"https://drive.google.com/uc?export=download&id={m.group(1)}"
    return url


def safe_fetch(url: str) -> bytes | None:
    """Fetch image bytes with SSRF guards. Returns None on any failure."""
    url = normalize_url(url)
    if not url:
        return None
    current = url
    for _ in range(MAX_REDIRECTS + 1):
        parsed = urlparse(current)
        if parsed.scheme not in ("http", "https") or not parsed.hostname:
            return None
        if not _host_allowed(parsed.hostname):
            logger.info("perfume image host rejected: %s", parsed.hostname)
            return None
        req = urllib.request.Request(current, headers={"User-Agent": "AIL SkinLabImageBot/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:  # noqa: S310 — guarded above
                final = resp.geturl()
                fparsed = urlparse(final)
                if fparsed.hostname and not _host_allowed(fparsed.hostname):
                    return None
                ctype = (resp.headers.get("Content-Type") or "").lower()
                if not ctype.startswith("image/"):
                    return None
                data = resp.read(MAX_BYTES + 1)
                if len(data) > MAX_BYTES:
                    return None
                return data
        except urllib.error.HTTPError as exc:  # type: ignore[attr-defined]
            if exc.code in (301, 302, 303, 307, 308) and exc.headers.get("Location"):
                loc = exc.headers["Location"]
                current = urllib.request.urljoin(current, loc)
                continue
            return None
        except Exception:  # noqa: BLE001
            return None
    return None


def _store_raw(data: bytes, dest: Path) -> bool:
    """PIL-less fallback: keep original bytes with a sniffed image extension."""
    ext = ".png" if data[:4] == b"\x89PNG" else ".jpg" if data[:3] == b"\xff\xd8\xff" else None
    if ext is None:
        return False
    target = dest.with_suffix(ext)
    try:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        return True
    except OSError:
        logger.exception("raw store failed for %s", target.name)
        return False


def _save_webp(data: bytes, dest: Path, max_side: int = 1200) -> bool:
    if Image is None:
        return _store_raw(data, dest)
    try:
        im = Image.open(BytesIO(data))
        im.load()
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGBA" if "A" in im.getbands() else "RGB")
        w, h = im.size
        scale = max_side / max(w, h)
        if scale < 1:
            im = im.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
        dest.parent.mkdir(parents=True, exist_ok=True)
        if im.mode == "RGBA":
            im.save(dest, "WEBP", quality=88)
        else:
            im.save(dest, "WEBP", quality=88)
        return True
    except Exception:  # noqa: BLE001
        logger.exception("webp convert failed for %s", dest.name)
        return False


def local_image(sku: str) -> Path | None:
    """data/perfume_images/<sku>.(png|jpg|jpeg|webp), lookalike/case-insensitive."""
    if not LOCAL_DIR.exists():
        return None
    target = re.sub(r"[^0-9A-Za-z]+", "", sku).lower()
    for f in LOCAL_DIR.iterdir():
        if f.suffix.lower() in IMG_EXTS and re.sub(r"[^0-9A-Za-z]+", "", f.stem).lower() == target:
            return f
    return None


def cached_image(sku: str) -> Path | None:
    base = re.sub(r"[^0-9A-Za-z]+", "", sku).lower()
    for f in CACHE_DIR.glob(f"{base}.*"):
        if f.suffix.lower() in (".webp", ".png", ".jpg", ".jpeg"):
            return f
    return None


def find_image(sku: str) -> Path | None:
    return local_image(sku) or cached_image(sku)


def mark_products_photo(products: list[dict[str, Any]]) -> None:
    """Set has_photo and kick off async downloads for missing images."""
    for p in products:
        p["has_photo"] = find_image(p["sku"]) is not None
    missing = [p for p in products if not p["has_photo"] and p.get("photo_url")]
    if missing:
        threading.Thread(target=_download_many, args=(missing,), daemon=True).start()


def _download_many(products: list[dict[str, Any]]) -> None:
    with _download_lock:
        queue = [p for p in products if p["sku"] not in _pending]
        _pending.update(p["sku"] for p in queue)
    from concurrent.futures import ThreadPoolExecutor
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    report_rows: list[dict[str, str]] = []

    def one(p: dict[str, Any]) -> None:
        sku, url = p["sku"], p.get("photo_url")
        status = "ok"
        if not url:
            status = "немає посилання"
        else:
            data = safe_fetch(url)
            if data is None:
                status = "недоступно"
            elif data[:15].lstrip().lower().startswith((b"<!doctype", b"<html")):
                status = "not_image"
            else:
                base = re.sub(r"[^0-9A-Za-z]+", "", sku).lower()
                if not _save_webp(data, CACHE_DIR / f"{base}.webp"):
                    status = "надто великий"
        report_rows.append({"sku": sku, "slug": p["slug"], "url": url or "", "status": status})

    with ThreadPoolExecutor(max_workers=4) as ex:
        list(ex.map(one, queue))
    if report_rows:
        import csv
        path = PROJECT_ROOT / "data" / "perfume_photos_report.csv"
        write_header = not path.exists()
        with path.open("a", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=["sku", "slug", "url", "status"])
            if write_header:
                w.writeheader()
            w.writerows(report_rows)
        # refresh flags for newly cached
        with _download_lock:
            for p in products:
                p["has_photo"] = find_image(p["sku"]) is not None
            _pending.difference_update(p["sku"] for p in products)


def resize_variant(path: Path, w: int) -> tuple[bytes, str] | None:
    """Return (bytes, media_type). Without Pillow the original file is served as-is."""
    if Image is None:
        try:
            return path.read_bytes(), _MEDIA_TYPES.get(path.suffix.lower(), "image/webp")
        except OSError:
            logger.exception("read failed %s", path.name)
            return None
    try:
        im = Image.open(path)
        im.load()
        ratio = w / im.width if im.width > w else 1
        if ratio < 1:
            im = im.resize((int(im.width * ratio), int(im.height * ratio)), Image.LANCZOS)
        buf = BytesIO()
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGBA" if "A" in im.getbands() else "RGB")
        im.save(buf, "WEBP", quality=86)
        return buf.getvalue(), "image/webp"
    except Exception:  # noqa: BLE001
        logger.exception("resize failed %s", path.name)
        return None
