"""Direction-constructor products endpoints (spec D.1)."""
from fastapi import APIRouter, Query

from ..models import Product
from ..store import catalog_store

router = APIRouter(prefix="/api/products", tags=["products"])


def skin_match(product: Product, skin: str | None) -> bool:
    """Strict-but-fair skin match: unknown tag never excludes a product."""
    if not skin:
        return True
    st = product.skin_types
    if not st:
        return True
    if "Всі типи" in st:
        return True
    return skin in st


def purpose_match(product: Product, purpose: str | None) -> bool:
    if not purpose:
        return True
    pr = product.purposes
    if not pr:
        return True
    return purpose in pr


def match_score(product: Product, skin: str | None, purpose: str | None) -> int:
    """Higher = better fit; used by sort=match."""
    score = 0
    if skin and product.skin_types:
        if skin in product.skin_types:
            score += 4
        elif "Всі типи" in product.skin_types:
            score += 1
    if purpose and product.purposes and purpose in product.purposes:
        score += 2
    return score


@router.get("", response_model=list[Product])
def list_products(
    skin: str | None = Query(None),
    purpose: str | None = Query(None),
    limit: int = Query(12, ge=1, le=100),
    sort: str = Query("match", description="match|price_asc|price_desc|name"),
):
    items = [
        p for p in catalog_store.products
        if skin_match(p, skin) and purpose_match(p, purpose)
    ]
    if sort == "match":
        items.sort(key=lambda p: (-match_score(p, skin, purpose), p.name_uk))
    elif sort == "price_asc":
        items.sort(key=lambda p: (p.promo_price or p.price))
    elif sort == "price_desc":
        items.sort(key=lambda p: (p.promo_price or p.price), reverse=True)
    elif sort == "name":
        items.sort(key=lambda p: p.name_uk)
    return items[:limit]


@router.get("/count")
def count_products(
    skin: str | None = Query(None),
    purpose: str | None = Query(None),
):
    n = sum(
        1 for p in catalog_store.products
        if skin_match(p, skin) and purpose_match(p, purpose)
    )
    return {"count": n}
