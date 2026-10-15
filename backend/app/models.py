"""Pydantic models describing catalog data returned by the API."""
from typing import Optional
from pydantic import BaseModel


class Product(BaseModel):
    id: str
    sku: str
    name: str
    name_uk: str
    name_ru: str
    name_en: str
    brand: str
    category: str
    price: float
    promo_price: Optional[float] = None
    discount_percent: float = 0
    stock: int = 0
    volume: str = ""
    country: str = ""
    description_uk: str = ""
    description_ru: str = ""
    description_en: str = ""
    image: str
    has_image: bool
    is_on_sale: bool
    tags: list[str] = []
    is_set: bool = False
    set_items: list[str] = []
    purposes: list[str] = []
    skin_types: list[str] = []


class CatalogResponse(BaseModel):
    items: list[Product]
    total: int
    brands: list[str]
    categories: list[str]
    last_updated: str
