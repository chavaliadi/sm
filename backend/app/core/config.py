"""
Application settings, loaded from environment variables (see .env.example).

Nothing else in the app should call os.environ directly — import `settings`
from here instead, so there's one place that knows how config is sourced.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://sagarmala:sagarmala@localhost:5432/sagarmala"
    secret_key: str = "change-me-to-a-long-random-string"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
