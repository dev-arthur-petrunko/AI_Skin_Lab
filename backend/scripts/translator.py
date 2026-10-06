"""Translate missing ru/en catalog fields from Ukrainian (Google Translate).

Usage:
    python scripts/translator.py                    # translate everything, save
    python scripts/translator.py --sku 123456       # translate one product
    python scripts/translator.py --dry-run          # preview only, no save
"""
from __future__ import annotations

import argparse
import logging
import sys
import time
from pathlib import Path

from deep_translator import GoogleTranslator, MyMemoryTranslator
from openpyxl import load_workbook

from app.catalog_loader import load_catalog
from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("translator")


def _find_sku_row(ws, sku: str):
    for row in ws.iter_rows(min_row=2):
        if row[0].value and str(row[0].value).strip() == sku:
            return row[0]
    return None


def _col_idx(ws):
    """Map short column name -> column index (1-based)."""
    result = {}
    for i, cell in enumerate(ws[1], start=1):
        if not cell.value:
            continue
        name = str(cell.value).strip().lower()
        for base in (name,
                     name.replace(" (uk)", "").replace(" (ru)", "").replace(" (en)", "")):
            if base not in result:
                result[base] = i
    return result


def translate_catalog(products=None, sku=None, dry_run=False, to=None):
    """Translate missing ru/en fields from Ukrainian.

    Args:
        sku: translate a single product only, or None for all products
        dry_run: if True, print what would be translated without saving to xlsx
        to: list of target languages, default ["ru", "en"]

    Returns:
        (cells_would_translate, cells_written) counts
    """
    if to is None:
        to = ["ru", "en"]
    targets = [t.strip() for t in to if t.strip()]
    if not targets:
        targets = ["ru", "en"]

    if products is None:
        products = load_catalog()

    excel_path = Path(settings.excel_path)
    if not excel_path.exists():
        logger.error("price.xlsx not found at %s", excel_path)
        return (0, 0)

    translators = {
        "ru": MyMemoryTranslator(source="uk", target="ru"),
        "en": MyMemoryTranslator(source="uk", target="en"),
    }

    wb = load_workbook(excel_path)
    ws = wb.active
    col_index = _col_idx(ws)

    # (dst_excel_header_key_lower, src_product_attr, lang)
    checks = [
        ("опис (ru)", "description_uk", "ru"),
        ("опис (en)", "description_uk", "en"),
        ("назва (ru)", "name", "ru"),
        ("назва (en)", "name", "en"),
    ]

    col_src_map = {(c[0], c[2]): c[1] for c in checks}

    # gather rows to translate per language
    rows_by_lang: dict[str, list[tuple[int, int, str, str, str]]] = {lang: [] for lang in targets}
    # (row_idx, col_idx, sku, col_name, src_val)

    for p in products:
        if sku and p.sku != sku:
            continue
        sku_cell = _find_sku_row(ws, p.sku)
        if not sku_cell:
            continue
        row_idx = sku_cell.row
        for col_name, src_attr, lang in checks:
            if lang not in targets:
                continue
            idx = col_index.get(col_name)
            if not idx:
                continue
            src_val = getattr(p, src_attr, "")
            if not src_val:
                continue
            if ws.cell(row=row_idx, column=idx).value:
                continue
            rows_by_lang[lang].append((row_idx, idx, p.sku, col_name, src_val))

    # translate per language in batches
    updates_by_sku: dict[str, dict[str, tuple[str, str]]] = {}
    total = 0
    for i, (lang, rows) in enumerate(rows_by_lang.items()):
        if not rows:
            continue
        texts = [r[4] for r in rows]
        try:
            results = translators[lang].translate_batch(texts, batch_size=50)
        except Exception as e:
            logger.error("translate_batch failed for %s: %s", lang, e)
            continue
        for (row_idx, idx, sku_val, col_name, _src_val), dst_val in zip(rows, results):
            if dst_val:
                src_attr = col_src_map[(col_name, lang)]
                updates_by_sku.setdefault(sku_val, {})[col_name] = (src_attr, dst_val)
                total += 1
        if i < len(rows_by_lang) - 1:
            time.sleep(1.5)  # respect Google rate limit

    if dry_run:
        logger.info("DRY RUN: would translate %d cells", total)
        for sku_key, updates in updates_by_sku.items():
            for col, (attr, value) in updates.items():
                print(f"[{sku_key}] {col} <- {attr}: {value[:80]}")
        return (total, 0)

    wb = load_workbook(excel_path)
    ws = wb.active
    col_index = _col_idx(ws)
    written = 0
    for sku_key, updates in updates_by_sku.items():
        sku_cell = _find_sku_row(ws, sku_key)
        if not sku_cell:
            continue
        row_idx = sku_cell.row
        for col, (attr, value) in updates.items():
            idx = col_index.get(col)
            if idx:
                ws.cell(row=row_idx, column=idx, value=value)
                written += 1
    wb.save(excel_path)
    logger.info("Translated and wrote %d/%d cells back to %s", written, total, excel_path)
    return (total, written)


def main() -> None:
    parser = argparse.ArgumentParser(description="Translate catalog from Ukrainian")
    parser.add_argument("--sku", help="translate single product only")
    parser.add_argument("--dry-run", action="store_true",
                        help="preview translations without saving to the Excel file")
    args = parser.parse_args()
    translate_catalog(sku=args.sku, dry_run=args.dry_run)


if __name__ == "__main__":
    main()