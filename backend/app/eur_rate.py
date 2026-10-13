"""Official NBU EUR -> UAH rate with periodic auto-refresh.

The catalog loader converts sheets with EUR price headers (e.g. the Anubis
"Ціна, €" column) using the rate returned by get_rate(). The rate is fetched
from the NBU public API at startup and then re-checked hourly; the fetched
value is reused for EUR_RATE_TTL hours. When the NBU API is unreachable the
last known rate is kept, and until the first successful fetch settings.eur_rate
(env EUR_RATE) is used as the fallback. EUR_RATE=0 disables conversion and
auto-fetch entirely.
"""
from __future__ import annotations

import json
import logging
import threading
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Callable

from .config import settings

logger = logging.getLogger("eur_rate")

NBU_URL = "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange"
TTL_OK_SECONDS = 6 * 3600   # NBU publishes new rates on workdays ~15:00
TTL_FAIL_SECONDS = 3600     # retry sooner after a failure
FETCH_TIMEOUT = 8.0
MIN_RATE = 10.0
MAX_RATE = 500.0

_lock = threading.Lock()
_rate: float | None = None
_source = "env"
_fetched_at = ""
_next_fetch = 0.0
_applied: float | None = None  # rate used by the last catalog load

_stop = threading.Event()
_thread: threading.Thread | None = None


def _fetch_nbu() -> tuple[float, str]:
    today = datetime.now().strftime("%Y%m%d")
    query = urllib.parse.urlencode({"json": "", "valcode": "EUR", "date": today})
    req = urllib.request.Request(
        f"{NBU_URL}?{query}",
        headers={"User-Agent": "AI-Skin-Lab/1.0"},
    )
    with urllib.request.urlopen(req, timeout=FETCH_TIMEOUT) as resp:
        rows = json.loads(resp.read().decode("utf-8"))
    for row in rows or []:
        if str(row.get("cc", "")).upper() == "EUR" or str(row.get("r030")) in ("978", "978.0"):
            rate = float(row["rate"])
            if MIN_RATE < rate < MAX_RATE:
                return rate, str(row.get("exchangedate") or "")
    raise ValueError("EUR row not found in NBU response")


def get_rate(force: bool = False) -> float:
    """Current EUR -> UAH rate. Fetches from NBU when the cache is stale."""
    if settings.eur_rate <= 0:
        return 0.0  # conversion disabled by configuration
    global _rate, _source, _fetched_at, _next_fetch
    with _lock:
        now = time.monotonic()
        if _rate is not None and not force and now < _next_fetch:
            return _rate
        try:
            rate, exchangedate = _fetch_nbu()
        except Exception as exc:  # noqa: BLE001
            _next_fetch = now + TTL_FAIL_SECONDS
            fallback = _rate if _rate is not None else float(settings.eur_rate)
            if _rate is None:
                _source = "env"
            logger.warning(
                "NBU EUR rate fetch failed (%s); keeping rate %g (%s)",
                exc, fallback, _source,
            )
            return fallback
        if _rate is not None and rate != _rate:
            logger.info("EUR rate changed %g -> %g (NBU)", _rate, rate)
        _rate = rate
        _source = "NBU"
        _fetched_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
        _next_fetch = now + TTL_OK_SECONDS
        logger.info("EUR rate from NBU: %g UAH/EUR (exchangedate %s)", rate, exchangedate or "?")
        return rate


def mark_loaded(rate: float) -> None:
    """Record the rate used by the last catalog load (for change detection)."""
    global _applied
    with _lock:
        _applied = rate


def snapshot() -> dict:
    with _lock:
        rate = _rate if _rate is not None else (
            float(settings.eur_rate) if settings.eur_rate > 0 else 0.0
        )
        return {"rate": rate, "source": _source, "fetched_at": _fetched_at}


def start_refresher(on_change: Callable[[], None]) -> None:
    """Hourly check: if the NBU rate differs from the one the catalog was
    loaded with, call on_change() (typically catalog_store.reload)."""
    global _thread
    if settings.eur_rate <= 0:
        logger.info("EUR auto-rate disabled (EUR_RATE=0)")
        return
    if _thread is not None:
        return
    _stop.clear()

    def _loop() -> None:
        logger.info("EUR rate refresher started (hourly NBU check)")
        while not _stop.wait(3600):
            try:
                new = get_rate()
                with _lock:
                    applied = _applied
                if applied is not None and abs(new - applied) > 1e-9:
                    logger.info(
                        "EUR rate %g differs from catalog rate %g — reloading",
                        new, applied,
                    )
                    on_change()
            except Exception:  # noqa: BLE001
                logger.exception("EUR refresher tick failed")

    _thread = threading.Thread(target=_loop, name="eur-rate-refresher", daemon=True)
    _thread.start()


def stop_refresher() -> None:
    global _thread
    _stop.set()
    if _thread is not None:
        _thread.join(timeout=2)
        _thread = None
