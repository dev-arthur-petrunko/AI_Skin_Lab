from pathlib import Path
from pydantic_settings import BaseSettings

PROJECT_ROOT = Path(__file__).resolve().parents[2]

class Settings(BaseSettings):
    app_name: str = "AI Skin Lab"
    excel_path: str = str(PROJECT_ROOT / "data" / "price.xlsx")
    images_dir: str = str(PROJECT_ROOT / "data" / "images")
    openai_api_key: str = ""
    embedding_model: str = "text-embedding-3-small"
    chat_model: str = "gpt-4o-mini"
    auto_translate: bool = False
    allowed_origins: str = "http://localhost:3000,http://localhost:8000"
    sheet_name: str = "Зручна таблиця"

    class Config:
        env_file = ".env"

settings = Settings()
