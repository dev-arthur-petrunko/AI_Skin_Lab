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
from pathlib import Path

from deep_translator import GoogleTranslator
from openpyxl import load_workbook

from app.catalog_loader import load_catalog

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

    excel_path = Path("/app/data/price.xlsx")
    if not excel_path.exists():
        logger.error("price.xlsx not found at %s", excel_path)
        return (0, 0)

    translators = {
        "ru": GoogleTranslator(source="uk", target="ru"),
        "en": GoogleTranslator(source="uk", target="en"),
    }

    wb = load_workbook(excel_path)
    ws = wb.active
    col_index = _col_idx(ws)

    # (dst_excel_header_key_lower, src_product_attr, lang)
    checks = [
        ("опис (ру)", "description_uk", "ru"),
        ("опис (ен)", "description_uk", "en"),
        ("назва (ру)", "name", "ru"),
        ("назва (ен)", "name", "en"),
    ]

    updates_by_sku = {}
    total = 0

    for p in products:
        if sku and p.sku != sku:
            continue
        sku_cell = _find_sku_row(ws, p.sku)
        if not sku_cell:
            continue
        row_idx = sku_cell.row
        for col, src_attr, lang in checks:
            if lang not in targets:
                continue
            idx = col_index.get(col)
            if not idx:
                continue
            src_val = getattr(p, src_attr, "")
            if not src_val:
                continue
            # не перезаписувати, якщо в Excel вже є переклад
            if ws.cell(row=row_idx, column=idx).value:
                continue
            dst_val = translators[lang].translate(src_val)
            if dst_val:
                updates_by_sku.setdefault(p.sku, {})[col] = (src_attr, dst_val)
                total += 1

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