"""Isolated perfume feature: own data file, own API, no impact on the main catalog."""
from __future__ import annotations

import logging
import threading

from fastapi import FastAPI

from . import orders
from .loader import store
from .router import router

logger = logging.getLogger("perfumes")


def setup(app: FastAPI) -> None:
    orders.register(router)  # must run before include_router (routes are copied on include)
    app.include_router(router)
    store.reload()

    def watch() -> None:
        try:
            from watchdog.events import FileSystemEventHandler
            from watchdog.observers import Observer
        except ImportError:
            logger.info("watchdog not installed — perfume store uses mtime auto-reload only")
            return
        from .loader import PRICE_XLSX, PERFUME_XLSX, _resolve_source

        class H(FileSystemEventHandler):
            def on_any_event(self, event):
                if event.is_directory:
                    return
                store.ensure_fresh()

        obs = Observer()
        for path in {PERFUME_XLSX.parent, PRICE_XLSX.parent}:
            try:
                obs.schedule(H(), str(path), recursive=False)
            except OSError:
                pass
        obs.daemon = True
        obs.start()

    threading.Thread(target=watch, daemon=True).start()
