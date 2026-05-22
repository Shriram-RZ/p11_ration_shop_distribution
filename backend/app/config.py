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
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
