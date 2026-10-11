from pathlib import Path
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
    # empty = <parent of images_dir>/cutouts (i.e. data/cutouts on the host)
    cutouts_dir: str = ""
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    embedding_model: str = "text-embedding-3-small"
    chat_model: str = "gpt-4o-mini"
    auto_translate: bool = False
    allowed_origins: str = "http://localhost:3000,http://localhost:8000"
    # EUR -> UAH conversion applied to sheets whose price headers are in €
    # (e.g. the Anubis sheet with "Ціна, €"). 0 disables conversion.
    eur_rate: float = 48.0
    currency: str = "грн"
    admin_token: str = ""

settings = Settings()
