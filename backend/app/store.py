"""In-memory catalog cache with automatic reload when price.xlsx changes.

Uses `watchdog` to monitor the data directory. On any modification of the
Excel file, the catalog is reparsed and the vector index for the AI
assistant is rebuilt, without needing to restart the server.
"""
from __future__ import annotations

import logging
import threading
import time
from pathlib import Path

from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

from .catalog_loader import get_file_mtime, load_catalog
from .config import settings
from .models import Product

logger = logging.getLogger("store")


class CatalogStore:
    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._products: list[Product] = []
        self._last_updated: str = ""
        self._on_reload_callbacks = []

    def reload(self) -> None:
        with self._lock:
            self._products = load_catalog()
            self._last_updated = get_file_mtime()
        logger.info("Catalog reloaded: %d products", len(self._products))
        for cb in self._on_reload_callbacks:
            try:
                cb(self._products)
            except Exception:  # noqa: BLE001
                logger.exception("Reload callback failed")

    def on_reload(self, callback) -> None:
        self._on_reload_callbacks.append(callback)

    @property
    def products(self) -> list[Product]:
        with self._lock:
            return list(self._products)

    @property
    def last_updated(self) -> str:
        with self._lock:
            return self._last_updated

    def get(self, product_id: str) -> Product | None:
        with self._lock:
            for p in self._products:
                if p.id == product_id:
                    return p
        return None


catalog_store = CatalogStore()


class _ExcelChangeHandler(FileSystemEventHandler):
    def __init__(self, target_path: Path) -> None:
        self.target_path = target_path.resolve()
        self._last_trigger = 0.0

    def _maybe_reload(self, event_path: str) -> None:
        try:
            if Path(event_path).resolve() != self.target_path:
                return
        except OSError:
            return
        now = time.time()
        if now - self._last_trigger < 1.0:
            return  # debounce rapid consecutive events
        self._last_trigger = now
        time.sleep(0.3)  # let the OS finish flushing the file
        catalog_store.reload()

    def on_modified(self, event) -> None:
        if not event.is_directory:
            self._maybe_reload(event.src_path)

    def on_created(self, event) -> None:
        if not event.is_directory:
            self._maybe_reload(event.src_path)


_observer: Observer | None = None
_poll_thread: threading.Thread | None = None
_stop_poll = threading.Event()


def _poll_loop(interval: float = 3.0) -> None:
    """Fallback mtime polling.

    Docker Desktop file shares (especially on Windows) do not always
    propagate inotify events from the host into the container, so in
    addition to watchdog we periodically compare the file mtime.
    """
    last_mtime: float | None = None
    excel_path = Path(settings.excel_path)
    while not _stop_poll.is_set():
        try:
            mtime = excel_path.stat().st_mtime if excel_path.exists() else None
        except OSError:
            mtime = None
        if mtime is not None and last_mtime is not None and mtime != last_mtime:
            catalog_store.reload()
        if mtime is not None:
            last_mtime = mtime
        _stop_poll.wait(interval)


def start_watcher() -> None:
    global _observer, _poll_thread
    excel_path = Path(settings.excel_path)
    watch_dir = excel_path.parent
    watch_dir.mkdir(parents=True, exist_ok=True)

    catalog_store.reload()

    handler = _ExcelChangeHandler(excel_path)
    observer = Observer()
    observer.schedule(handler, str(watch_dir), recursive=False)
    observer.start()
    _observer = observer
    logger.info("Watching %s for changes", excel_path)

    _stop_poll.clear()
    _poll_thread = threading.Thread(target=_poll_loop, name="excel-mtime-poll", daemon=True)
    _poll_thread.start()


def stop_watcher() -> None:
    global _observer, _poll_thread
    _stop_poll.set()
    if _observer is not None:
        _observer.stop()
        _observer.join(timeout=2)
        _observer = None
    if _poll_thread is not None:
        _poll_thread.join(timeout=2)
        _poll_thread = None
