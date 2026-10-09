"""FastAPI application entry point for AI Skin Lab backend."""
import logging
import mimetypes
import secrets
from contextlib import asynccontextmanager

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .ai_assistant import vector_index
from .cutouts import cutout_name, cutouts_dir, schedule_generate
from .routers import catalog, chat
from .store import catalog_store, start_watcher, stop_watcher
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from scripts.translator import translate_catalog

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")


def _require_admin(x_admin_token: str | None) -> None:
    """Guard /admin/* routes.

    If ADMIN_TOKEN is not configured the endpoints are disabled entirely,
    so a default deployment never exposes an unauthenticated write path.
    """
    if not settings.admin_token:
        raise HTTPException(status_code=404, detail="Not found")
    if not x_admin_token or not secrets.compare_digest(x_admin_token, settings.admin_token):
        raise HTTPException(status_code=401, detail="Invalid admin token")


def _rebuild_index(products) -> None:
    vector_index.build(products)


@asynccontextmanager
async def lifespan(app: FastAPI):
    catalog_store.on_reload(_rebuild_index)
    catalog_store.on_reload(schedule_generate)
    start_watcher()
    _rebuild_index(catalog_store.products)
    yield
    stop_watcher()


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.allowed_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(catalog.router)
app.include_router(chat.router)

Path(settings.images_dir).mkdir(parents=True, exist_ok=True)
app.mount("/images", StaticFiles(directory=settings.images_dir), name="images")

# python:3.11-slim's mime database has no .webp mapping
mimetypes.add_type("image/webp", ".webp")

_cutouts_dir = cutouts_dir()
_cutouts_dir.mkdir(parents=True, exist_ok=True)
app.mount("/cutouts", StaticFiles(directory=str(_cutouts_dir)), name="cutouts")


@app.get("/api/cutouts")
def cutout_ids():
    ids = [
        p.id
        for p in catalog_store.products
        if (_cutouts_dir / f"{cutout_name(p.id)}.webp").exists()
    ]
    return {"ids": ids}


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "products": len(catalog_store.products),
        "last_updated": catalog_store.last_updated,
    }

@app.get("/admin/reload")
def admin_reload(x_admin_token: str | None = Header(default=None)):
    _require_admin(x_admin_token)
    catalog_store.reload()
    return {'status': 'reloaded', 'products': len(catalog_store.products)}

@app.get("/admin/translate")
def admin_translate(to: str = "ru,en", dry_run: bool = False, sku: str | None = None,
                    x_admin_token: str | None = Header(default=None)):
    _require_admin(x_admin_token)
    cells, written = translate_catalog(to=to.split(","), dry_run=dry_run, sku=sku)
    return {'status': 'translated', 'to': to, 'dry_run': dry_run, 'sku': sku, 'cells': cells, 'written': written}
