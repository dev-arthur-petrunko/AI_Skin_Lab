"""FastAPI application entry point for AI Skin Lab backend."""
import logging
import mimetypes
import secrets
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from . import eur_rate
from .routers import catalog, orders, products
from .perfumes import setup as setup_perfumes
from .store import catalog_store, start_watcher, stop_watcher

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


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_watcher()
    eur_rate.start_refresher(catalog_store.reload)
    yield
    eur_rate.stop_refresher()
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
app.include_router(orders.router)
app.include_router(products.router)
setup_perfumes(app)

class _NoCacheStaticFiles(StaticFiles):
    """Static files that always revalidate (ETag/Last-Modified), never heuristically cached.

    Product photos are updated in place; without Cache-Control browsers apply
    heuristic freshness and keep showing stale images.
    """

    def file_response(self, *args, **kwargs):  # type: ignore[override]
        resp = super().file_response(*args, **kwargs)
        resp.headers["Cache-Control"] = "no-cache"
        return resp


Path(settings.images_dir).mkdir(parents=True, exist_ok=True)
app.mount("/images", _NoCacheStaticFiles(directory=settings.images_dir), name="images")

# python:3.11-slim's mime database has no .webp mapping
mimetypes.add_type("image/webp", ".webp")


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "products": len(catalog_store.products),
        "last_updated": catalog_store.last_updated,
        "eur_rate": eur_rate.snapshot(),
    }

@app.get("/admin/reload")
def admin_reload(x_admin_token: str | None = Header(default=None)):
    _require_admin(x_admin_token)
    catalog_store.reload()
    return {'status': 'reloaded', 'products': len(catalog_store.products)}
