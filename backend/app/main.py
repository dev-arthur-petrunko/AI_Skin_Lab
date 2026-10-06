"""FastAPI application entry point for AI Skin Lab backend."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .ai_assistant import vector_index
from .routers import catalog, chat
from .store import catalog_store, start_watcher, stop_watcher

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")


def _rebuild_index(products) -> None:
    vector_index.build(products)


@asynccontextmanager
async def lifespan(app: FastAPI):
    catalog_store.on_reload(_rebuild_index)
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

app.mount("/images", StaticFiles(directory=settings.images_dir), name="images")


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "products": len(catalog_store.products),
        "last_updated": catalog_store.last_updated,
    }

@app.get("/admin/reload")
def admin_reload():
    catalog_store.reload()
    return {'status': 'reloaded', 'products': len(catalog_store.products)}

@app.get("/admin/translate")
def admin_translate(to: str = "ru,en", dry_run: bool = False):
    cells, written = translate_catalog(to=to.split(","), dry_run=dry_run)
    return {'status': 'translated', 'to': to, 'dry_run': dry_run, 'cells': cells, 'written': written}
