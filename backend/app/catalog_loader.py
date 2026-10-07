"""Reads price.xlsx and converts it into a list of Product objects.

Expected sheet "Зручна таблиця" columns (based on ДУХИ_2026_зручна.xlsx template):
    Артикул, Назва товару, Бренд, Ціна, грн, Промо ціна, грн, Знижка, %,
    Залишок, шт, Об'єм, Країна-виробник, Короткий опис (ноти), Фото

Optional extended columns supported for full i18n / richer catalog data
(add them to the Excel file to activate multilingual content and categories):
    Назва (ru), Назва (en), Категорія,
    Опис (uk), Опис (ru), Опис (en), Image_Name
"""
from __future__ import annotations

import logging
import math
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd

from .config import settings
from .models import Product

logger = logging.getLogger("catalog_loader")

COLUMN_ALIASES = {
    "sku": ["Артикул", "SKU", "ID"],
    "name": ["Назва товару", "Назва", "Name"],
    "name_ru": ["Назва (ru)", "Назва_RU", "Name_RU"],
    "name_en": ["Назва (en)", "Назва_EN", "Name_EN"],
    "brand": ["Бренд", "Brand"],
    "category": ["Категорія", "Category", "Тип"],
    "price": ["Ціна, грн", "Ціна", "Price"],
    "promo_price": ["Промо ціна, грн", "Промо ціна", "Promo Price"],
    "discount_percent": ["Знижка, %", "Знижка", "Discount"],
    "stock": ["Залишок, шт", "Залишок", "Stock"],
    "volume": ["Об'єм", "Обʼєм", "Volume"],
    "country": ["Країна-виробник", "Країна", "Country"],
    "description": ["Короткий опис (ноти)", "Опис", "Description"],
    "description_uk": ["Опис (uk)", "Description_UK"],
    "description_ru": ["Опис (ru)", "Description_RU"],
    "description_en": ["Опис (en)", "Description_EN"],
    "image": ["Image_Name", "Фото", "Image"],
}

CATEGORY_KEYWORDS = [
    ("Парфумована вода", ["парфумован", "edp", "eau de parfum"]),
    ("Туалетна вода", ["туалетна вода", "edt", "eau de toilette"]),
    ("Крем", ["крем"]),
    ("Сироватка", ["сироватка", "serum"]),
    ("Догляд за обличчям", ["обличч"]),
    ("Догляд за тілом", ["тіло", "тіла"]),
]


def _find_column(columns: list[str], aliases: list[str]) -> str | None:
    norm_cols = {c.strip().lower(): c for c in columns}
    for alias in aliases:
        key = alias.strip().lower()
        if key in norm_cols:
            return norm_cols[key]
    return None


def _to_float(value: Any) -> float:
    if value is None:
        return 0.0
    if isinstance(value, (int, float)):
        if isinstance(value, float) and math.isnan(value):
            return 0.0
        return float(value)
    text = str(value).strip().replace(" ", "").replace(",", ".")
    match = re.search(r"-?\d+(\.\d+)?", text)
    return float(match.group()) if match else 0.0


def _to_int(value: Any) -> int:
    return int(_to_float(value))


def _clean_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, float) and math.isnan(value):
        return ""
    return str(value).strip()


def _guess_category(name: str, description: str) -> str:
    haystack = f"{name} {description}".lower()
    for category, keywords in CATEGORY_KEYWORDS:
        if any(k in haystack for k in keywords):
            return category
    return "Інше"


def _extract_tags(name: str, description: str, brand: str) -> list[str]:
    text = f"{name} {description}".lower()
    tags: list[str] = []
    tag_map = {
        "суха шкіра": ["сух", "зволож", "hydrat"],
        "жирна шкіра": ["жирн", "матув"],
        "антивіковий": ["anti-age", "антивіков", "зморшк"],
        "квіткові ноти": ["квітков"],
        "деревні ноти": ["деревн"],
        "цитрусові ноти": ["цитрус"],
        "орієнтальні ноти": ["орієнтальн"],
        "ніжний аромат": ["ніжн", "легк"],
    }
    for tag, keywords in tag_map.items():
        if any(k in text for k in keywords):
            tags.append(tag)
    if brand:
        tags.append(brand.lower())
    return tags


def _norm_name(value: str) -> str:
    """Excel may store an image code as a float -> '700703706708711.0'."""
    name = str(value).strip()
    if name.endswith(".0") and name[:-2].isdigit():
        name = name[:-2]
    return name


def _resolve_image(sku: str, image_value: str) -> tuple[str, bool]:
    images_dir = Path(settings.images_dir)
    extensions = ("", ".jpg", ".jpeg", ".png", ".webp")

    raw: list[str] = []
    if image_value and not image_value.lower().startswith("http") and "переглянути" not in image_value.lower():
        raw.append(_norm_name(image_value))
    raw.append(sku)
    padded = sku.zfill(3)
    if padded != sku:
        raw.append(padded)

    # An Excel "Фото" cell may hold a bare code ("700703706708711") with no
    # extension, so every stem is tried with/without a known image extension.
    candidates = [
        f"{stem}{ext}"
        for stem in raw
        if stem and "/" not in stem and "\\" not in stem
        for ext in extensions
    ]

    if images_dir.exists():
        for candidate in candidates:
            if (images_dir / candidate).exists():
                return f"/images/{candidate}", True
    return "/images/placeholder.svg", False


def load_catalog(auto_translate=False) -> list[Product]:
    """Parse the Excel workbook into a list of validated Product models."""
    if auto_translate:
        try:
            from scripts.translator import translate_catalog as _translate
        except ImportError:  # pragma: no cover
            logger.warning("Translator unavailable, skipping auto-translate")
        else:
            try:
                _translate(products=load_catalog())
            except Exception:  # noqa: BLE001
                logger.exception("Auto-translate failed")

    excel_path = Path(settings.excel_path)
    if not excel_path.exists():
        logger.warning("Excel file not found at %s", excel_path)
        return []

    try:
        df = pd.read_excel(excel_path, sheet_name=settings.sheet_name, engine="openpyxl")
    except ValueError:
        # fallback to first sheet if configured sheet name is missing
        df = pd.read_excel(excel_path, sheet_name=0, engine="openpyxl")

    columns = list(df.columns)
    col = {key: _find_column(columns, aliases) for key, aliases in COLUMN_ALIASES.items()}

    products: list[Product] = []
    seen_ids: set[str] = set()

    for _, row in df.iterrows():
        sku_raw = row.get(col["sku"]) if col["sku"] else None
        if sku_raw is None or (isinstance(sku_raw, float) and math.isnan(sku_raw)):
            continue
        sku = _clean_text(sku_raw)
        if not sku:
            continue

        name = _clean_text(row.get(col["name"])) if col["name"] else ""
        if not name:
            continue

        name_ru = _clean_text(row.get(col["name_ru"])) if col.get("name_ru") else ""
        name_en = _clean_text(row.get(col["name_en"])) if col.get("name_en") else ""

        description = _clean_text(row.get(col["description"])) if col["description"] else ""
        description_uk = _clean_text(row.get(col["description_uk"])) if col.get("description_uk") else description
        description_ru = _clean_text(row.get(col["description_ru"])) if col.get("description_ru") else description
        description_en = _clean_text(row.get(col["description_en"])) if col.get("description_en") else description

        brand = _clean_text(row.get(col["brand"])) if col["brand"] else ""
        category = _clean_text(row.get(col["category"])) if col.get("category") else ""
        if not category:
            category = _guess_category(name, description_uk)

        price = _to_float(row.get(col["price"])) if col["price"] else 0.0
        promo_raw = _to_float(row.get(col["promo_price"])) if col["promo_price"] else 0.0
        promo_price = promo_raw if promo_raw and promo_raw < price else None

        discount_percent = _to_float(row.get(col["discount_percent"])) if col.get("discount_percent") else 0.0
        if not discount_percent and promo_price and price:
            discount_percent = round((1 - promo_price / price) * 100, 1)

        stock = _to_int(row.get(col["stock"])) if col.get("stock") else 0
        volume = _clean_text(row.get(col["volume"])) if col.get("volume") else ""
        country = _clean_text(row.get(col["country"])) if col.get("country") else ""

        image_value = _clean_text(row.get(col["image"])) if col.get("image") else ""
        image, has_image = _resolve_image(sku, image_value)

        product_id = sku
        suffix = 1
        while product_id in seen_ids:
            suffix += 1
            product_id = f"{sku}-{suffix}"
        seen_ids.add(product_id)

        tags = _extract_tags(name, description_uk, brand)

        products.append(
            Product(
                id=product_id,
                sku=sku,
                name=name,
                name_uk=name,
                name_ru=name_ru or name,
                name_en=name_en or name,
                brand=brand,
                category=category,
                price=price,
                promo_price=promo_price,
                discount_percent=discount_percent,
                stock=stock,
                volume=volume,
                country=country,
                description_uk=description_uk,
                description_ru=description_ru,
                description_en=description_en,
                image=image,
                has_image=has_image,
                is_on_sale=bool(promo_price),
                tags=tags,
            )
        )

    logger.info("Loaded %d products from %s", len(products), excel_path)
    return products


def get_file_mtime() -> str:
    excel_path = Path(settings.excel_path)
    if not excel_path.exists():
        return datetime.now(timezone.utc).isoformat()
    return datetime.fromtimestamp(excel_path.stat().st_mtime, tz=timezone.utc).isoformat()
