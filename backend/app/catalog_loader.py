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
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd

from . import eur_rate
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
    "price": ["Ціна, грн", "Ціна", "Price", "Ціна, €", "Ціна (€)", "Price, EUR"],
    "promo_price": ["Промо ціна, грн", "Промо ціна", "Promo Price", "Промо ціна, €", "Промо ціна (€)"],
    "discount_percent": ["Знижка, %", "Знижка", "Discount"],
    "stock": ["Залишок, шт", "Залишок", "Stock"],
    "volume": ["Об'єм", "Обʼєм", "Volume"],
    "country": ["Країна-виробник", "Країна", "Country"],
    "description": ["Короткий опис (ноти)", "Опис", "Description"],
    "description_uk": ["Опис (uk)", "Description_UK"],
    "description_ru": ["Опис (ru)", "Description_RU"],
    "description_en": ["Опис (en)", "Description_EN"],
    "image": ["Image_Name", "Фото", "Image"],
    "skin_types": ["Тип шкіри", "Тип кожи", "Skin type"],
    "purposes": ["Призначення", "Призначення/Показання", "Purpose"],
}

CATEGORY_KEYWORDS = [
    # bare "парфумован" also matches creams ("парфумований крем") — keep phrases
    ("Парфумована вода", ["парфумована вода", "парфюмована вода", "eau de parfum", "edp"]),
    ("Туалетна вода", ["туалетна вода", "edt", "eau de toilette"]),
    ("Крем", ["крем"]),
    ("Сироватка", ["сироватка", "serum"]),
    ("Догляд за обличчям", ["обличч"]),
    ("Догляд за тілом", ["тіло", "тіла"]),
]

# optional second sheet — gift sets; two supported formats:
#   1) composition: has "Склад (артикули через кому)" -> build set products from SKUs
#   2) mark list:   has "Артикул" column only -> those main-sheet SKUs become
#                   gift sets (is_set=True, category "Набори")
SETS_SHEET = "sets"
SET_COLUMN_ALIASES = {
    "sku": ["Артикул", "SKU", "ID"],
    "name": ["Назва набору", "Назва", "Name"],
    "items": ["Склад (артикули через кому)", "Склад", "Артикули", "Items"],
    "price": ["Ціна набору, грн", "Ціна набору", "Ціна"],
    "discount": ["Знижка, %", "Знижка"],
    "image": ["Фото", "Image_Name", "Image"],
    "description": ["Опис", "Description"],
}


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


# cyrillic look-alikes that appear in Excel SKUs -> latin (A.5)
# А→A В→B С→C Е→E Н→H К→K М→M О→O Р→P Т→T Х→X (upper+lower)
_SKU_TRANSLATION = str.maketrans(
    "\u0410\u0412\u0421\u0415\u041d\u041a\u041c\u041e\u0420\u0422\u0425"
    "\u0430\u0432\u0441\u0435\u043d\u043a\u043c\u043e\u0440\u0442\u0445",
    "ABCEHKMOPTX" + "abcehkmoptx",
)


def _norm_sku(value: Any) -> str:
    """Strip whitespace and replace cyrillic look-alike letters with latin."""
    s = _clean_text(value)
    return s.translate(_SKU_TRANSLATION).strip()


# --- direction value normalisation (spec A.2 / D.4) ---
VALID_PURPOSES = [
    "Зволоження", "Відновлення", "Заспокоєння та почервоніння",
    "Освітлення та пігментація", "Антивіковий догляд", "Антиоксидантний захист",
    "Очищення", "Освіження та тонізація", "Матування та пори",
    "Акне та проблемна шкіра", "Сонцезахист", "Догляд за очима",
    "Делікатні зони",
]
VALID_SKIN_TYPES = ["Нормальна", "Суха", "Жирна", "Комбінована", "Чутлива", "Проблемна", "Всі типи"]

_DIRECTION_ALIASES = {
    "себорегуляція": "Матування та пори",
    "ліфтинг": "Антивіковий догляд",
    "lifting": "Антивіковий догляд",
    "омолодження": "Антивіковий догляд",
    "розгладження зморшок": "Антивіковий догляд",
    "ревіталізація": "Антивіковий догляд",
    "освітлення": "Освітлення та пігментація",
    "вирівнювання тону": "Освітлення та пігментація",
    "зменшення почервоніння": "Заспокоєння та почервоніння",
    "купероз": "Заспокоєння та почервоніння",
    "звуження пор": "Матування та пори",
    "живлення": "Зволоження",
    "заспокоєння": "Заспокоєння та почервоніння",
    "освіження": "Освіження та тонізація",
    "тонізація": "Освіження та тонізація",
    "зменшення акне": "Акне та проблемна шкіра",
    "відновлення бар'єру": "Відновлення",
}


def parse_direction_values(raw: Any, valid: list[str]) -> list[str]:
    """Split raw Excel cell on ; , newline and canonicalise through aliases.

    Unknown values are kept (lower-cased first letter) and appended at the end.
    """
    if raw is None:
        return []
    if isinstance(raw, float) and math.isnan(raw):
        return []
    text = str(raw).strip()
    if not text:
        return []
    parts = re.split(r"[;,\n/]", text)
    out: list[str] = []
    valid_lower = {v.lower(): v for v in valid}
    for part in parts:
        p = part.strip().strip(".").strip()
        if not p or len(p) > 60:
            continue
        low = p.lower()
        if low in _DIRECTION_ALIASES:
            v = _DIRECTION_ALIASES[low]
        elif low in valid_lower:
            v = valid_lower[low]
        else:
            # try substring match against valid values
            v = None
            for cand in valid:
                if low in cand.lower() or cand.lower() in low:
                    v = cand
                    break
            if v is None:
                v = p  # unknown -> keep as-is, appended at end
        if v not in out:
            out.append(v)
    # canonical values first, unknown at the end
    known = [v for v in out if v in valid]
    unknown = [v for v in out if v not in valid]
    return known + unknown


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


# Cyrillic lookalikes that regularly sneak into photo filenames (Windows
# Explorer keyboard layout) — "А09010200.png" vs sku "A09010200".
_LOOKALIKE_TABLE = str.maketrans({
    "А": "A", "В": "B", "Е": "E", "К": "K", "М": "M", "Н": "H",
    "О": "O", "Р": "P", "С": "C", "Т": "T", "Х": "X", "а": "a",
    "о": "o", "с": "c", "е": "e", "р": "p", "х": "x",
})
_IMG_EXTS = {".png", ".jpg", ".jpeg", ".webp"}
_IMG_INDEX: dict[str, Any] = {"key": None, "map": {}}


def _canon_stem(name: str) -> str:
    return unicodedata.normalize("NFC", name).translate(_LOOKALIKE_TABLE).lower().strip()


def _image_index(images_dir: Path) -> dict[str, str]:
    """Stem -> filename map, refreshed when files are added/removed."""
    try:
        key = (str(images_dir), images_dir.stat().st_mtime)
    except OSError:
        return {}
    if _IMG_INDEX["key"] != key:
        mapping: dict[str, str] = {}
        if images_dir.exists():
            for f in images_dir.iterdir():
                if f.is_file() and f.suffix.lower() in _IMG_EXTS:
                    mapping.setdefault(_canon_stem(f.stem), f.name)
        _IMG_INDEX["key"] = key
        _IMG_INDEX["map"] = mapping
    return _IMG_INDEX["map"]


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
        index = _image_index(images_dir)
        for stem in raw:
            hit = index.get(_canon_stem(stem))
            if hit:
                return f"/images/{hit}", True
    return "/images/placeholder.svg", False


def load_sets(excel_path: Path, by_sku: dict[str, Product]) -> tuple[list[Product], set[str]]:
    """Read the optional "sets" sheet. Returns (synthetic set products, skus to mark).

    Format 1 — composition (has "Склад (артикули через кому)" column):
        one row = one gift set of existing SKUs; columns:
        Назва набору | Склад (артикули через кому) | Ціна набору, грн |
        Знижка, % | Фото | Опис
        Price falls back to the sum of items, stock = min(stock), image = first item's.
    Format 2 — mark list (has "Артикул" column, no composition column):
        each row's sku marks the matching main-sheet product as a gift set
        (is_set=True, category "Набори").
    Missing sheet / bad rows are skipped silently.
    """
    try:
        xl = pd.ExcelFile(excel_path, engine="openpyxl")
        sheet = next((s for s in xl.sheet_names if s.strip().lower() == SETS_SHEET), None)
        if sheet is None:
            return [], set()
        df = xl.parse(sheet).fillna("")
    except Exception:  # noqa: BLE001 — no workbook / unreadable sheet
        return [], set()
    columns = list(df.columns)
    col = {key: _find_column(columns, aliases) for key, aliases in SET_COLUMN_ALIASES.items()}

    if not col["items"]:
        # format 2: plain list of SKUs to mark as gift sets
        if not col["sku"]:
            return [], set()
        skus: set[str] = set()
        for _, row in df.iterrows():
            sku = _norm_sku(row.get(col["sku"])) if col["sku"] else ""
            if sku and sku.lower() not in ("артикул", "sku", "id"):
                skus.add(sku)
        return [], skus

    out: list[Product] = []
    for _, row in df.iterrows():
        items_raw = _clean_text(row.get(col["items"])) if col["items"] else ""
        skus = [_norm_sku(s) for s in re.split(r"[;,]", items_raw) if s.strip()]
        items = [by_sku[s] for s in skus if s in by_sku]
        if not items:
            continue

        set_id = "set-" + "-".join(re.sub(r"[^\w.-]+", "-", s).strip("-") for s in skus)
        if set_id in {p.id for p in out}:
            continue

        name = _clean_text(row.get(col["name"])) if col["name"] else ""
        if not name:
            name = "Набір " + " + ".join(i.name for i in items[:3])

        total = sum(p.price for p in items)
        set_price = _to_float(row.get(col["price"])) if col["price"] else 0.0
        set_price = set_price if 0 < set_price < total else None
        discount = _to_float(row.get(col["discount"])) if col.get("discount") else 0.0
        if not set_price and discount:
            set_price = round(total * (1 - discount / 100), 2)
        if not discount and set_price:
            discount = round((1 - set_price / total) * 100, 1)
        promo_price = set_price if set_price and set_price < total else None

        stock = min(p.stock for p in items)
        brand = items[0].brand
        image, has_image = items[0].image, items[0].has_image
        if col.get("image"):
            image_value = _clean_text(row.get(col["image"]))
            if image_value:
                resolved, ok = _resolve_image(set_id, image_value)
                if ok:
                    image, has_image = resolved, True

        desc = _clean_text(row.get(col["description"])) if col.get("description") else ""
        composition = " + ".join(p.name for p in items)
        description_uk = f"Подарунковий набір: {composition}." + (f" {desc}" if desc else "")

        tags = _extract_tags(name, description_uk, brand) + ["набір"]

        out.append(
            Product(
                id=set_id,
                sku=set_id,
                name=name,
                name_uk=name,
                name_ru=name,
                name_en=name,
                brand=brand,
                category="Набори",
                price=total,
                promo_price=promo_price,
                discount_percent=discount,
                stock=stock,
                volume="",
                country="",
                description_uk=description_uk,
                description_ru=description_uk,
                description_en=description_uk,
                image=image,
                has_image=has_image,
                is_on_sale=bool(promo_price),
                tags=tags,
                is_set=True,
                set_items=[p.id for p in items],
            )
        )
    return out, set()


def _parse_products(
    df: pd.DataFrame,
    col: dict[str, str | None],
    seen_ids: set[str],
    price_rate: float = 1.0,
) -> list[Product]:
    """Convert one product sheet into Product models (price_rate scales € -> ₴)."""
    products: list[Product] = []
    for _, row in df.iterrows():
        sku_raw = row.get(col["sku"]) if col["sku"] else None
        if sku_raw is None or (isinstance(sku_raw, float) and math.isnan(sku_raw)):
            continue
        sku = _norm_sku(sku_raw)
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

        price = round(_to_float(row.get(col["price"])) * price_rate, 2) if col["price"] else 0.0
        promo_raw = round(_to_float(row.get(col["promo_price"])) * price_rate, 2) if col["promo_price"] else 0.0
        promo_price = promo_raw if promo_raw and promo_raw < price else None

        discount_percent = _to_float(row.get(col["discount_percent"])) if col.get("discount_percent") else 0.0
        if not discount_percent and promo_price and price:
            discount_percent = round((1 - promo_price / price) * 100, 1)

        stock = _to_int(row.get(col["stock"])) if col.get("stock") else 0
        volume = _clean_text(row.get(col["volume"])) if col.get("volume") else ""
        country = _clean_text(row.get(col["country"])) if col.get("country") else ""

        image_value = _norm_sku(row.get(col["image"])) if col.get("image") else ""
        image, has_image = _resolve_image(sku, image_value)

        skin_types = parse_direction_values(row.get(col["skin_types"]), VALID_SKIN_TYPES) if col.get("skin_types") else []
        purposes = parse_direction_values(row.get(col["purposes"]), VALID_PURPOSES) if col.get("purposes") else []

        product_id = sku
        suffix = 1
        while product_id in seen_ids:
            suffix += 1
            product_id = f"{sku}-{suffix}"
        seen_ids.add(product_id)

        tags = _extract_tags(name, description_uk, brand)
        if price_rate != 1.0:
            tags.append("eur")

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
                purposes=purposes,
                skin_types=skin_types,
            )
        )
    return products


def load_catalog(auto_translate=False) -> list[Product]:
    """Parse the Excel workbook into a list of validated Product models.

    Every sheet except "sets" (case-insensitive) is treated as a product sheet
    and must contain Артикул + Назва columns; sheets are merged into one
    catalog. Sheets whose price headers are denominated in € (e.g. "Ціна, €")
    are converted to UAH with settings.eur_rate.
    """
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
        xl = pd.ExcelFile(excel_path, engine="openpyxl")
    except Exception:  # noqa: BLE001
        logger.exception("Cannot open workbook %s", excel_path)
        return []

    excluded = {s.strip().lower() for s in settings.excluded_sheets.split(",") if s.strip()}
    product_sheets = [
        s for s in xl.sheet_names
        if s.strip().lower() != SETS_SHEET and s.strip().lower() not in excluded
    ]
    for skipped in xl.sheet_names:
        if skipped.strip().lower() in excluded:
            logger.info("Sheet %r excluded by EXCLUDED_SHEETS setting", skipped)
    products: list[Product] = []
    seen_ids: set[str] = set()

    for sheet in product_sheets:
        df = xl.parse(sheet).fillna("")
        columns = list(df.columns)
        col = {key: _find_column(columns, aliases) for key, aliases in COLUMN_ALIASES.items()}
        if not col["sku"] or not col["name"]:
            logger.info("Skipping sheet %r — no sku/name columns", sheet)
            continue
        price_header = str(col["price"] or "")
        is_eur = "€" in price_header or "eur" in price_header.lower()
        rate = 1.0
        if is_eur:
            if settings.eur_rate > 0:
                rate = eur_rate.get_rate()
                eur_rate.mark_loaded(rate)
            # EUR_RATE=0 disables conversion (rate stays 1.0)
        sheet_products = _parse_products(df, col, seen_ids, rate)
        logger.info(
            "Sheet %r: %d products%s",
            sheet,
            len(sheet_products),
            f" (EUR x{rate:g})" if rate != 1.0 else "",
        )
        products.extend(sheet_products)

    by_sku: dict[str, Product] = {}
    for p in products:
        by_sku.setdefault(p.sku, p)
    sets, mark_skus = load_sets(excel_path, by_sku)
    if mark_skus:
        marked = 0
        for p in products:
            if p.sku in mark_skus:
                p.is_set = True
                p.category = "Набори"
                if "набір" not in p.tags:
                    p.tags.append("набір")
                marked += 1
        logger.info("Marked %d products as gift sets from the sets sheet", marked)
    if sets:
        logger.info("Loaded %d gift sets", len(sets))
        products.extend(sets)

    logger.info("Loaded %d products from %s", len(products), excel_path)
    return products


def get_file_mtime() -> str:
    excel_path = Path(settings.excel_path)
    if not excel_path.exists():
        return datetime.now(timezone.utc).isoformat()
    return datetime.fromtimestamp(excel_path.stat().st_mtime, tz=timezone.utc).isoformat()
