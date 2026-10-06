"""RAG-powered AI consultant.

Flow:
  1. Build a simple in-memory vector index of products (embeddings of
     name + description + tags) whenever the catalog reloads.
  2. On a user query, embed the query and retrieve top-K most similar
     products (cosine similarity via numpy, no external vector DB needed
     for a catalog of this size — swap for ChromaDB/FAISS if it grows).
  3. Feed the retrieved products + conversation history to the chat model
     with a system prompt instructing it to act as a cosmetics/perfume
     consultant, and return a natural-language reply plus product cards.

If no OPENAI_API_KEY is configured, falls back to a lightweight keyword
search so the feature still works out of the box in a demo/offline mode.
"""
from __future__ import annotations

import logging
import re
from typing import Optional

import numpy as np

from .config import settings
from .models import ChatMessage, ChatProductCard, Product

logger = logging.getLogger("ai_assistant")

try:
    from openai import OpenAI
except ImportError:  # pragma: no cover
    OpenAI = None  # type: ignore

_client: Optional["OpenAI"] = None
if settings.openai_api_key and OpenAI is not None:
    _client = OpenAI(api_key=settings.openai_api_key, base_url=settings.openai_base_url)


class VectorIndex:
    """Minimal vector index: embeddings matrix + parallel product list."""

    def __init__(self) -> None:
        self.products: list[Product] = []
        self.embeddings: Optional[np.ndarray] = None

    def build(self, products: list[Product]) -> None:
        self.products = products
        if not products or _client is None:
            self.embeddings = None
            return
        texts = [_product_to_text(p) for p in products]
        try:
            vectors = _embed_texts(texts)
            self.embeddings = np.array(vectors, dtype=np.float32)
            logger.info("Vector index built for %d products", len(products))
        except Exception:  # noqa: BLE001
            logger.exception("Failed to build vector index, falling back to keyword search")
            self.embeddings = None

    def search(self, query: str, top_k: int = 5) -> list[Product]:
        if not self.products:
            return []
        if self.embeddings is not None and _client is not None:
            try:
                q_vec = np.array(_embed_texts([query])[0], dtype=np.float32)
                sims = _cosine_similarity(self.embeddings, q_vec)
                top_idx = np.argsort(-sims)[:top_k]
                return [self.products[i] for i in top_idx]
            except Exception:  # noqa: BLE001
                logger.exception("Embedding search failed, falling back to keyword search")
        return _keyword_search(self.products, query, top_k)


def _product_to_text(p: Product) -> str:
    return " ".join([p.name, p.brand, p.category, p.description_uk, " ".join(p.tags)])


def _embed_texts(texts: list[str]) -> list[list[float]]:
    assert _client is not None
    resp = _client.embeddings.create(model=settings.embedding_model, input=texts)
    return [d.embedding for d in resp.data]


def _cosine_similarity(matrix: np.ndarray, vector: np.ndarray) -> np.ndarray:
    matrix_norm = matrix / (np.linalg.norm(matrix, axis=1, keepdims=True) + 1e-9)
    vector_norm = vector / (np.linalg.norm(vector) + 1e-9)
    return matrix_norm @ vector_norm


def _keyword_search(products: list[Product], query: str, top_k: int) -> list[Product]:
    query_words = set(re.findall(r"\w+", query.lower()))
    scored = []
    for p in products:
        text = _product_to_text(p).lower()
        score = sum(1 for w in query_words if w in text)
        if score > 0:
            scored.append((score, p))
    scored.sort(key=lambda t: t[0], reverse=True)
    if scored:
        return [p for _, p in scored[:top_k]]
    return products[:top_k]


vector_index = VectorIndex()

SYSTEM_PROMPT = {
    "uk": (
        "Ти — ввічливий та експертний консультант-косметолог і парфюмер магазину AI Skin Lab. "
        "Клієнт описує свою потребу. Нижче наведено список товарів з нашого асортименту, що підходять "
        "під запит. Порекомендуй 1-3 товари з цього списку, поясни простими словами, чому вони підходять, "
        "будь доброзичливим, можеш використовувати емодзі. Не вигадуй товари, яких немає у списку. "
        "Відповідай українською мовою."
    ),
    "ru": (
        "Ты — вежливый и экспертный консультант-косметолог и парфюмер магазина AI Skin Lab. "
        "Клиент описывает свою потребность. Ниже приведён список товаров из нашего ассортимента, "
        "подходящих под запрос. Порекомендуй 1-3 товара из этого списка, объясни простыми словами, "
        "почему они подходят, будь доброжелательным, можешь использовать эмодзи. Не выдумывай товары, "
        "которых нет в списке. Отвечай на русском языке."
    ),
    "en": (
        "You are a polite, expert skincare and perfume consultant for the AI Skin Lab store. "
        "The client describes their need. Below is a list of matching products from our catalog. "
        "Recommend 1-3 products from this list, explain in simple terms why they fit, be friendly, "
        "emojis are welcome. Never invent products that are not in the list. Reply in English."
    ),
}

FALLBACK_REPLY = {
    "uk": "На жаль, зараз я не можу з'єднатися з AI-сервісом, але ось товари, які можуть вам підійти:",
    "ru": "К сожалению, сейчас я не могу связаться с AI-сервисом, но вот товары, которые могут вам подойти:",
    "en": "Sorry, I can't reach the AI service right now, but here are some products that might suit you:",
}


def _format_products_for_prompt(products: list[Product], lang: str) -> str:
    lines = []
    for p in products:
        price_line = (
            f"{p.promo_price} {settings.currency} (знижка {p.discount_percent}%)"
            if p.promo_price else f"{p.price} {settings.currency}"
        )
        lines.append(
            f"- [{p.id}] {p.localized_name(lang)} ({p.brand}): {price_line}. "
            f"{p.localized_description(lang)[:220]}"
        )
    return "\n".join(lines)


def chat(message: str, lang: str, history: list[ChatMessage]) -> tuple[str, list[ChatProductCard]]:
    candidates = vector_index.search(message, top_k=5)
    cards = [
        ChatProductCard(
            id=p.id,
            name=p.localized_name(lang),
            brand=p.brand,
            price=p.price,
            promo_price=p.promo_price,
            image=p.image,
            discount_percent=p.discount_percent,
        )
        for p in candidates[:3]
    ]

    if _client is None:
        reply = FALLBACK_REPLY.get(lang, FALLBACK_REPLY["uk"])
        return reply, cards

    system_prompt = SYSTEM_PROMPT.get(lang, SYSTEM_PROMPT["uk"])
    catalog_block = _format_products_for_prompt(candidates, lang)

    messages = [{"role": "system", "content": f"{system_prompt}\n\nТовари:\n{catalog_block}"}]
    for h in history[-6:]:
        messages.append({"role": h.role, "content": h.content})
    messages.append({"role": "user", "content": message})

    try:
        resp = _client.chat.completions.create(
            model=settings.chat_model,
            messages=messages,
            temperature=0.6,
            max_tokens=500,
        )
        reply = resp.choices[0].message.content or ""
    except Exception:  # noqa: BLE001
        logger.exception("Chat completion failed")
        reply = FALLBACK_REPLY.get(lang, FALLBACK_REPLY["uk"])

    return reply, cards
