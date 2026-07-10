"""
ResumeRank AI Service — Configuration via environment variables.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    port: int = 8000

    class Config:
        env_prefix = "AI_SERVICE_"
        env_file = ".env"
        extra = "ignore"


settings = Settings()
