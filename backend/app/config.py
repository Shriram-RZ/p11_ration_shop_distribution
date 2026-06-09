from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/rationflow"
    SECRET_KEY: str = "rationflow-secret-key-change-in-production-minimum-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    FIRST_ADMIN_EMAIL: str = "admin@rationflow.gov.in"
    FIRST_ADMIN_PASSWORD: str = "Admin@123456"
    APP_NAME: str = "RationFlow"
    DEBUG: bool = False
    # Stored as a raw comma-separated string so pydantic-settings does not try to
    # JSON-decode the env var. Use `allowed_origins` for the parsed list.
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def allowed_origins(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
