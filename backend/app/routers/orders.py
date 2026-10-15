"""Orders API: accept orders from frontend, validate, send to Telegram, log to JSONL."""
import asyncio
import html
import json
import logging
import os
import re
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field, field_validator

from ..config import settings
from ..store import catalog_store

router = APIRouter()
log = logging.getLogger("orders")

# Orders log file
DATA_DIR = Path(os.getenv("DATA_DIR", "data"))
ORDERS_LOG = Path(os.getenv("ORDERS_LOG", str(DATA_DIR / "orders.jsonl")))

# In-memory rate limiting
_hits: dict[str, list[float]] = {}


class Item(BaseModel):
    id: str = Field(min_length=1, max_length=64)
    qty: int = Field(ge=1, le=99)


class OrderIn(BaseModel):
    items: list[Item] = Field(min_length=1, max_length=30)
    name: str = Field(min_length=2, max_length=80)
    phone: str
    comment: str = Field(default="", max_length=500)
    locale: str = "uk"
    website: str = ""  # honeypot field

    @field_validator("phone")
    @classmethod
    def norm_phone(cls, v: str) -> str:
        d = re.sub(r"\D", "", v)
        if len(d) == 10 and d.startswith("0"):
            d = "38" + d
        if d.startswith("380") and len(d) == 12:
            return f"+{d[:3]} {d[3:5]} {d[5:8]} {d[8:10]} {d[10:]}"
        if 10 <= len(d) <= 15:
            return f"+{d}"
        raise ValueError("phone")


def rate_limited(ip: str, limit: int = 5, window: int = 600) -> bool:
    """Simple in-memory rate limiter: max 5 requests per 10 minutes per IP."""
    now = time.time()
    hits = [t for t in _hits.get(ip, []) if now - t < window]
    hits.append(now)
    _hits[ip] = hits
    return len(hits) > limit


def next_order_no() -> str:
    """Generate sequential order number: AS-YYMMDD-NNN"""
    today = datetime.now().strftime("%y%m%d")
    n = 1
    if ORDERS_LOG.exists():
        n += sum(
            1 for l in ORDERS_LOG.open(encoding="utf-8")
            if f'"AS-{today}-' in l and '"status"' not in l
        )
    return f"AS-{today}-{n:03d}"


async def tg_send(text: str, markup: Optional[dict] = None) -> bool:
    """Send message to all configured chat IDs with retries."""
    if not settings.telegram_bot_token or not settings.telegram_chat_ids:
        log.error("Telegram is not configured (missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID)")
        return False

    payload = {"text": text, "parse_mode": "HTML", "disable_web_page_preview": True}
    if markup:
        payload["reply_markup"] = markup

    async with httpx.AsyncClient(timeout=10) as client:
        for chat_id in settings.telegram_chat_ids:
            ok = False
            for attempt in range(3):
                try:
                    r = await client.post(
                        f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage",
                        json={**payload, "chat_id": chat_id}
                    )
                    if r.status_code == 200:
                        ok = True
                        break
                    log.warning("Telegram status %s for chat %s", r.status_code, chat_id)
                except httpx.HTTPError as e:
                    log.warning("Telegram error for chat %s: %s", chat_id, type(e).__name__)
                await asyncio.sleep(1.5 * (attempt + 1))
            if not ok:
                return False
    return True


def _get_product(product_id: str):
    """Get product from catalog store by ID."""
    return catalog_store.get(product_id)


router = APIRouter(prefix="/api", tags=["orders"])


@router.post("/orders")
async def create_order(o: OrderIn, request: Request):
    """Create new order: validate, lookup products, send to Telegram, log."""
    # Honeypot: bots fill hidden fields
    if o.website:
        return {"ok": True}

    # Rate limiting by IP
    ip = (
        request.headers.get("cf-connecting-ip") or
        request.headers.get("x-forwarded-for", "").split(",")[0].strip() or
        (request.client.host if request.client else "?")
    )
    if rate_limited(ip):
        raise HTTPException(429, "too_many_requests")

    # Lookup products and build order
    lines = []
    total = 0
    qty_sum = 0
    saved_items = []

    for i, item in enumerate(o.items, 1):
        product = _get_product(item.id)
        if not product:
            raise HTTPException(422, f"unknown_product: {item.id}")

        price = product.promo_price if product.promo_price else product.price
        line_sum = round(price * item.qty)
        total += line_sum
        qty_sum += item.qty

        lines.append(
            f"<b>{i}. {html.escape(product.name_uk)}</b>\n"
            f"    Артикул: <code>{html.escape(str(product.sku))}</code>\n"
            f"    Кількість: <b>{item.qty}</b> × {price:g} ₴ = {line_sum} ₴"
        )
        saved_items.append({
            "id": item.id,
            "sku": str(product.sku),
            "name": product.name_uk,
            "qty": item.qty,
            "price": price,
        })

    order_no = next_order_no()

    # Ensure orders log directory exists
    ORDERS_LOG.parent.mkdir(parents=True, exist_ok=True)

    # Log order BEFORE sending (so we never lose an order)
    with ORDERS_LOG.open("a", encoding="utf-8") as f:
        f.write(json.dumps({
            "order_no": order_no,
            "ts": datetime.now().isoformat(timespec="seconds"),
            "name": o.name,
            "phone": o.phone,
            "comment": o.comment,
            "items": saved_items,
            "total": total,
            "locale": o.locale,
        }, ensure_ascii=False) + "\n")

    # Build Telegram message
    text = (
        f"🛒 <b>Нове замовлення {order_no}</b>\n━━━━━━━━━━━━━━\n"
        + "\n\n".join(lines)
        + f"\n━━━━━━━━━━━━━━\n💵 <b>Разом: {total} ₴</b> ({qty_sum} шт.)\n\n"
        f"👤 Ім'я: {html.escape(o.name)}\n"
        f"📞 Телефон: {html.escape(o.phone)}\n"
        f"💬 Коментар: {html.escape(o.comment) or '—'}\n\n"
        f"🌐 Мова: {o.locale.upper()} · 🕒 {datetime.now():%d.%m.%Y %H:%M}"
    )
    # Telegram limit is 4096 chars
    text = text[:4000]

    # Inline button to open chat with client (if they have Telegram)
    digits = re.sub(r"\D", "", o.phone)
    markup = {
        "inline_keyboard": [[{
            "text": "💬 Відкрити чат з клієнтом",
            "url": f"https://t.me/+{digits}"
        }]]
    }

    sent = await tg_send(text, markup)

    # Update log with status
    with ORDERS_LOG.open("a", encoding="utf-8") as f:
        f.write(json.dumps({"order_no": order_no, "status": "sent" if sent else "failed"}) + "\n")

    if not sent:
        raise HTTPException(502, "telegram_failed")

    return {"ok": True, "order_no": order_no}