from pathlib import Path
import json

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings

PROJECT_ROOT = Path(__file__).resolve().parents[2]

class Settings(BaseSettings):
    model_config = {
        "env_file": (str(PROJECT_ROOT / ".env"), ".env"),
        "extra": "ignore",
        "case_sensitive": False,
    }

    app_name: str = "AI Skin Lab"
    excel_path: str = str(PROJECT_ROOT / "data" / "price.xlsx")
    images_dir: str = str(PROJECT_ROOT / "data" / "images")
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    embedding_model: str = "text-embedding-3-small"
    chat_model: str = "gpt-4o-mini"
    auto_translate: bool = False
    # Comma-separated Excel sheet names to skip at load (case-insensitive).
    # "Perfume" is hidden from the site until the owner re-enables it.
    excluded_sheets: str = "Perfume"
    allowed_origins: str = "http://localhost:3000,http://localhost:8000"
    # Fallback EUR -> UAH rate for sheets with € price headers (e.g. Anubis).
    # Normally the backend fetches the official NBU rate daily and uses it
    # instead (see app/eur_rate.py); this value is only used until the first
    # successful fetch or while the NBU API is unreachable.
    # 0 disables EUR conversion and the NBU auto-fetch entirely.
    eur_rate: float = 48.0
    currency: str = "грн"
    admin_token: str = ""
    telegram_bot_token: str = ""
    # raw env value: accepts "123", "123,456" or JSON '["123"]'; empty allowed
    telegram_chat_ids_raw: str = Field(
        default="",
        validation_alias=AliasChoices("TELEGRAM_CHAT_IDS", "TELEGRAM_CHAT_ID"),
    )

    @property
    def telegram_chat_ids(self) -> list[str]:
        raw = (self.telegram_chat_ids_raw or "").strip()
        if not raw:
            return []
        if raw.startswith("["):
            try:
                parsed = json.loads(raw)
                return [str(x).strip() for x in parsed if str(x).strip()]
            except (ValueError, TypeError):
                pass
        return [x.strip().strip('"') for x in raw.split(",") if x.strip()]

settings = Settings()
