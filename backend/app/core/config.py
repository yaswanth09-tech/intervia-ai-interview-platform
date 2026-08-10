from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db_name: str = "interview_analyzer"

    jwt_secret_key: str = "dev-secret-key-change-in-production-12345"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440

    frontend_origin: str = "http://localhost:8000"

    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


settings = Settings()