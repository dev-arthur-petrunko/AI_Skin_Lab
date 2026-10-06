from __future__ import annotations

import logging
from pathlib import Path

from app.store import catalog_store

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cron-reload")


def main() -> None:
    excel = Path("/app/data/price.xlsx")
    logger.info("Cron check: price.xlsx exists=%s mtime=%s", excel.exists(),
                excel.stat().st_mtime if excel.exists() else None)
    if excel.exists():
        catalog_store.reload()
        logger.info("Catalog reloaded by cron: %d products", len(catalog_store.products))
    else:
        logger.warning("price.xlsx not found at /app/data/price.xlsx")


if __name__ == "__main__":
    main()