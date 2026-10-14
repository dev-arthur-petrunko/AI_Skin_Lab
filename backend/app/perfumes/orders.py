"""Isolated perfume order endpoint (Telegram + jsonl). Independent of catalog cart."""
from __future__ import annotations

import html
import json
import logging
import os
import re
import time
from collections import defaultdict, deque
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

logger = logging.getLogger("perfumes.orders")

from .loader import PROJECT_ROOT
ORDERS_FILE = PROJECT_ROOT / "data" / "perfume_orders.jsonl"
ENABLED = os.getenv("PERFUME_ORDERS_ENABLED", "1").strip() == "1"

_hits: dict[str, deque[float]] = defaultdict(deque)


class OrderItem(BaseModel):
    slug: str
    qty: int = 1


class PerfumeOrder(BaseModel):
    items: list[OrderItem]
    name: str
    phone: str
    comment: str = ""
    website: str = ""  # honeypot


def _normalize_phone(raw: str) -> str | None:
    digits = re.sub(r"\D", "", raw or "")
    if digits.startswith("80") and len(digits) == 12:
        digits = "3" + digits
    if digits.startswith("380") and len(digits) == 12:
        return f"+{digits}"
    if digits.startswith("0") and len(digits) == 10:
        return f"+38{digits}"
    if 10 <= len(digits) <= 15:
        return "+" + digits
    return None


def _rate_limited(ip: str) -> bool:
    now = time.time()
    q = _hits[ip]
    while q and now - q[0] > 600:
        q.popleft()
    if len(q) >= 5:
        return True
    q.append(now)
    return False


def register(router: APIRouter) -> None:
    if not ENABLED:
        return

    @router.post("/api/perfumes/order")
    async def perfume_order(request: Request, order: PerfumeOrder):
        from .loader import store

        ip = request.client.host if request.client else "unknown"
        if _rate_limited(ip):
            raise HTTPException(status_code=429, detail="Забагато спроб. Спробуйте пізніше.")
        if order.website:
            raise HTTPException(status_code=422, detail="Invalid")
        name = order.name.strip()
        if not 2 <= len(name) <= 80:
            raise HTTPException(status_code=422, detail="Ім'я: 2–80 символів")
        phone = _normalize_phone(order.phone)
        if not phone:
            raise HTTPException(status_code=422, detail="Некоректний телефон")

        products, _reason = store.snapshot()
        by_slug = {p["slug"]: p for p in products}
        lines, total, qty_sum, missing = [], 0.0, 0, False
        for item in order.items:
            if not 1 <= item.qty <= 99:
                raise HTTPException(status_code=422, detail="Кількість 1–99")
            p = by_slug.get(item.slug)
            if not p or not p["in_stock"] or item.qty > p["stock"]:
                missing = True
                continue
            line_total = (p["promo_price"] or p["price"]) * item.qty
            total += line_total
            qty_sum += item.qty
            lines.append((p, item.qty, line_total))
        if missing or not lines:
            raise HTTPException(status_code=422, detail="Деякі товари недоступні")

        stamp = datetime.now(timezone.utc).isoformat()
        record = {
            "ts": stamp,
            "name": name,
            "phone": phone,
            "comment": order.comment.strip()[:500],
            "total": total,
            "items": [
                {"sku": p["sku"], "name": p["name"], "qty": q, "price": p["promo_price"] or p["price"], "sum": lt}
                for p, q, lt in lines
            ],
        }
        ORDERS_FILE.parent.mkdir(parents=True, exist_ok=True)
        with ORDERS_FILE.open("a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")

        esc = html.escape
        msg_parts = ["🧴 <b>Замовлення: Духи</b>\n"]
        for p, q, lt in lines:
            price = p["promo_price"] or p["price"]
            msg_parts.append(
                f"• {esc(p['name'])}\n  {esc(p['sku'])} · {q} × {price:.0f} грн = <b>{lt:.0f} грн</b>\n"
            )
        msg_parts.append(f"\n💰 <b>Разом: {total:.0f} грн</b> ({qty_sum} шт.)\n")
        msg_parts.append(f"👤 {esc(name)}\n📞 {esc(phone)}\n")
        if record["comment"]:
            msg_parts.append(f"💬 {esc(record['comment'])}\n")
        msg_parts.append("\nРозділ: Духи")
        text = "".join(msg_parts)[:4000]

        token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
        raw_ids = (os.getenv("TELEGRAM_CHAT_IDS") or os.getenv("TELEGRAM_CHAT_ID") or "").strip()
        chat_ids = [
            c.strip().strip("[]'\"")
            for c in raw_ids.replace("[", "").replace("]", "").split(",")
            if c.strip().strip("[]'\"")
        ]
        if not token or not chat_ids:
            raise HTTPException(status_code=502, detail="Telegram не налаштовано")

        import urllib.request
        ok = False
        for chat in chat_ids:
            payload = json.dumps({"chat_id": chat, "text": text, "parse_mode": "HTML"}).encode()
            req = urllib.request.Request(
                f"https://api.telegram.org/bot{token}/sendMessage",
                data=payload,
                headers={"Content-Type": "application/json"},
            )
            try:
                with urllib.request.urlopen(req, timeout=10) as resp:  # noqa: S310
                    ok = resp.status == 200 or ok
            except Exception:  # noqa: BLE001
                logger.exception("telegram send failed for chat %s", chat)
        if not ok:
            raise HTTPException(status_code=502, detail="Не вдалося надіслати замовлення")
        return {"status": "sent", "total": total}
