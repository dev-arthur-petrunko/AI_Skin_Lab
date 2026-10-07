"""Catalog endpoints: list products, get one, filters metadata."""
from fastapi import APIRouter, HTTPException, Query

from ..models import CatalogResponse, Product
from ..store import catalog_store

router = APIRouter(prefix="/api/catalog", tags=["catalog"])


@router.get("", response_model=CatalogResponse)
def get_catalog(
    search: str | None = Query(None),
    brand: str | None = Query(None),
    category: str | None = Query(None),
    on_sale: bool | None = Query(None),
    min_price: float | None = Query(None),
    max_price: float | None = Query(None),
    sort: str | None = Query(None, description="price_asc|price_desc|discount|name"),
):
    products = catalog_store.products

    if search:
        q = search.lower()
        products = [
            p for p in products
            if q in p.name.lower() or q in p.brand.lower()
            or q in p.category.lower() or q in p.description_uk.lower()
            or q in p.sku.lower()
        ]
    if brand:
        products = [p for p in products if p.brand.lower() == brand.lower()]
    if category:
        products = [p for p in products if p.category.lower() == category.lower()]
    if on_sale:
        products = [p for p in products if p.is_on_sale]
    if min_price is not None:
        products = [p for p in products if (p.promo_price or p.price) >= min_price]
    if max_price is not None:
        products = [p for p in products if (p.promo_price or p.price) <= max_price]

    if sort == "price_asc":
        products.sort(key=lambda p: p.promo_price or p.price)
    elif sort == "price_desc":
        products.sort(key=lambda p: p.promo_price or p.price, reverse=True)
    elif sort == "discount":
        products.sort(key=lambda p: p.discount_percent, reverse=True)
    elif sort == "name":
        products.sort(key=lambda p: p.name)

    all_products = catalog_store.products
    brands = sorted({p.brand for p in all_products if p.brand})
    categories = sorted({p.category for p in all_products if p.category})

    return CatalogResponse(
        items=products,
        total=len(products),
        brands=brands,
        categories=categories,
        last_updated=catalog_store.last_updated,
    )


@router.get("/sale", response_model=list[Product])
def get_sale_products(limit: int = 12):
    products = [p for p in catalog_store.products if p.is_on_sale]
    products.sort(key=lambda p: p.discount_percent, reverse=True)
    return products[:limit]


@router.get("/{product_id}", response_model=Product)
def get_product(product_id: str):
    product = catalog_store.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
