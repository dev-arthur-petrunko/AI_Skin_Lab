"""Read-only API for the isolated perfume page."""
from __future__ import annotations

import math
from typing import Any

from fastapi import APIRouter, HTTPException, Query, Response

from .images import find_image, resize_variant
from .loader import store

router = APIRouter()


def _public(p: dict[str, Any]) -> dict[str, Any]:
    return {k: p.get(k) for k in (
        "slug", "sku", "name", "display_name", "brand", "gender", "type",
        "price", "promo_price", "discount", "in_stock", "low_stock",
        "volume_ml", "country", "families", "notes", "description", "has_photo",
        "note_list",
    )}


def _match(p: dict[str, Any], f: dict[str, Any]) -> bool:
    q = f.get("q", "").strip().lower()
    if q:
        hay = " ".join([
            p.get("name", ""), p.get("brand", ""), p.get("sku", ""),
            " ".join(p.get("note_list", [])), " ".join(p.get("families", [])),
        ]).lower()
        if q not in hay:
            return False
    if f.get("brand") and p.get("brand") not in f["brand"]:
        return False
    if f.get("gender") and p.get("gender") not in f["gender"]:
        return False
    if f.get("family") and not (set(p.get("families", [])) & set(f["family"])):
        return False
    if f.get("note"):
        notes_lower = {n.lower() for n in p.get("note_list", [])}
        if not (notes_lower & {n.lower() for n in f["note"]}):
            return False
    if f.get("volume"):
        if p.get("volume_ml") not in f["volume"]:
            return False
    if f.get("price_min") is not None and (p.get("promo_price") or p["price"]) < f["price_min"]:
        return False
    if f.get("price_max") is not None and (p.get("promo_price") or p["price"]) > f["price_max"]:
        return False
    if f.get("sale") and not p.get("discount"):
        return False
    if f.get("in_stock") and not p.get("in_stock"):
        return False
    return True


def _filters(q: str, brand, gender, family, note, volume, price_min, price_max, sale, in_stock) -> dict[str, Any]:
    def split(v: str | None) -> list[str]:
        return [x.strip() for x in (v or "").split(",") if x.strip()]
    vols = [int(v) for v in split(volume) if v.isdigit()]
    return {
        "q": q or "", "brand": split(brand), "gender": split(gender),
        "family": split(family), "note": split(note), "volume": vols,
        "price_min": price_min, "price_max": price_max,
        "sale": bool(sale), "in_stock": bool(in_stock),
    }


def _sort(items: list[dict[str, Any]], sort: str) -> list[dict[str, Any]]:
    key_price = lambda p: p.get("promo_price") or p["price"]  # noqa: E731
    if sort == "price_asc":
        return sorted(items, key=key_price)
    if sort == "price_desc":
        return sorted(items, key=lambda p: -key_price(p))
    if sort == "discount":
        return sorted(items, key=lambda p: -p.get("discount", 0))
    if sort == "name":
        return sorted(items, key=lambda p: p.get("display_name") or p.get("name", ""))
    return sorted(items, key=lambda p: (not p.get("in_stock"), -p.get("discount", 0), key_price(p)))


@router.get("/api/perfumes")
def list_perfumes(
    q: str = "", brand: str = "", gender: str = "", family: str = "",
    note: str = "", volume: str = "", price_min: float | None = None,
    price_max: float | None = None, sale: int = 0, in_stock: int = 0,
    sort: str = "default", page: int = 1, limit: int = 24,
):
    products, reason = store.snapshot()
    f = _filters(q, brand, gender, family, note, volume, price_min, price_max, sale, in_stock)
    matched = _sort([p for p in products if _match(p, f)], sort)
    total = len(matched)
    page = max(1, page)
    limit = max(1, min(100, limit))
    start = (page - 1) * limit
    return {
        "items": [_public(p) for p in matched[start:start + limit]],
        "total": total,
        "page": page,
        "pages": max(1, math.ceil(total / limit)),
        "reason": reason,
    }


@router.get("/api/perfumes/facets")
def facets(
    q: str = "", brand: str = "", gender: str = "", family: str = "",
    note: str = "", volume: str = "", price_min: float | None = None,
    price_max: float | None = None, sale: int = 0, in_stock: int = 0,
):
    products, _ = store.snapshot()
    f = _filters(q, brand, gender, family, note, volume, price_min, price_max, sale, in_stock)
    matched = [p for p in products if _match(p, f)]

    def counts(values_fn, field: str) -> list[dict[str, Any]]:
        out: dict[str, int] = {}
        for p in matched:
            for v in values_fn(p):
                out[v] = out.get(v, 0) + 1
        return sorted(({"value": k, "count": v} for k, v in out.items()), key=lambda x: -x["count"])

    notes_out: dict[str, int] = {}
    for p in matched:
        for n in p.get("note_list", []):
            notes_out[n] = notes_out.get(n, 0) + 1
    top_notes = sorted(({"value": k, "count": v} for k, v in notes_out.items()), key=lambda x: -x["count"])[:12]
    prices = [(p.get("promo_price") or p["price"]) for p in matched]
    return {
        "brands": counts(lambda p: [p["brand"]] if p.get("brand") else [], "brand"),
        "genders": counts(lambda p: [p["gender"]] if p.get("gender") else [], "gender"),
        "families": counts(lambda p: p.get("families", []), "family"),
        "volumes": counts(lambda p: [str(p["volume_ml"])] if p.get("volume_ml") else [], "volume"),
        "notes": top_notes,
        "price_range": {"min": min(prices) if prices else 0, "max": max(prices) if prices else 0},
    }


@router.get("/api/perfumes/meta")
def meta():
    products, reason = store.snapshot()
    brands = {p["brand"] for p in products if p.get("brand")}
    max_discount = max((p.get("discount", 0) for p in products), default=0)
    from .loader import store as st
    return {
        "count": len(products),
        "brands": len(brands),
        "max_discount": max_discount,
        "last_updated": st.last_updated,
        "reason": reason,
    }


def _similar(products: list[dict[str, Any]], p: dict[str, Any]) -> list[dict[str, Any]]:
    scored = []
    fam, notes = set(p.get("families", [])), {n.lower() for n in p.get("note_list", [])}
    for o in products:
        if o["slug"] == p["slug"]:
            continue
        s = len(fam & set(o.get("families", []))) * 2
        s += len(notes & {n.lower() for n in o.get("note_list", [])})
        if o.get("brand") == p.get("brand"):
            s += 1
        if s > 0:
            scored.append((s, o))
    scored.sort(key=lambda x: -x[0])
    return [_public(o) for _, o in scored[:4]]


@router.get("/api/perfumes/image/{slug}")
def image(slug: str, w: int = 960):
    products, _ = store.snapshot()
    p = next((x for x in products if x["slug"] == slug), None)
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    path = find_image(p["sku"])
    if not path:
        raise HTTPException(status_code=404, detail="No image")
    w = 480 if w <= 480 else 960
    result = resize_variant(path, w)
    if not result:
        raise HTTPException(status_code=500, detail="Convert failed")
    data, media_type = result
    return Response(
        content=data,
        media_type=media_type,
        headers={"Cache-Control": "public, max-age=86400"},
    )


@router.get("/api/perfumes/{slug}")
def detail(slug: str):
    products, reason = store.snapshot()
    p = next((x for x in products if x["slug"] == slug), None)
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    out = _public(p)
    out["similar"] = _similar(products, p)
    out["reason"] = reason
    return out
