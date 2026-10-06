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

    def localized_name(self, lang: str) -> str:
        return {"uk": self.name_uk, "ru": self.name_ru, "en": self.name_en}.get(lang, self.name_uk)

    def localized_description(self, lang: str) -> str:
        return {
            "uk": self.description_uk,
            "ru": self.description_ru,
            "en": self.description_en,
        }.get(lang, self.description_uk)


class CatalogResponse(BaseModel):
    items: list[Product]
    total: int
    brands: list[str]
    categories: list[str]
    last_updated: str


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    lang: str = "uk"
    history: list[ChatMessage] = []


class ChatProductCard(BaseModel):
    id: str
    name: str
    brand: str
    price: float
    promo_price: Optional[float] = None
    image: str
    discount_percent: float = 0


class ChatResponse(BaseModel):
    reply: str
    products: list[ChatProductCard] = []
