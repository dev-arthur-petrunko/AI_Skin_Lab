"""Application configuration loaded from environment variables (.env)."""
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Project root (two levels up from backend/app/), used as fallback paths for
# local development; inside Docker the environment variables take priority.
PROJECT_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(str(PROJECT_ROOT / ".env"), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Paths
    excel_path: str = str(PROJECT_ROOT / "data" / "price.xlsx")
    images_dir: str = str(PROJECT_ROOT / "data" / "images")
    sheet_name: str = "Зручна таблиця"

    # AI
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    chat_model: str = "gpt-4o-mini"
    embedding_model: str = "text-embedding-3-small"

    # CORS
    allowed_origins: str = "http://localhost:3000"

    # App
    app_name: str = "AI Skin Lab API"
    currency: str = "грн"
    auto_translate: bool = False


settings = Settings()