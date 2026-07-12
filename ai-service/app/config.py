"""
ResumeRank AI Service — Configuration via environment variables.
"""

import os

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    port: int = 8000

    class Config:
        env_prefix = "AI_SERVICE_"
        env_file = ".env"
        extra = "ignore"


settings = Settings()

# ---------------------------------------------------------------------------
# Feature flag: set DISABLE_SENTENCE_TRANSFORMERS=true to skip loading
# sentence-transformers + torch entirely. No try/except — the import is
# skipped at the source so torch is never even loaded into memory.
# Use on Render free tier (<512 MB) or any memory-constrained environment.
# ---------------------------------------------------------------------------
DISABLE_SENTENCE_TRANSFORMERS: bool = (
    os.getenv("DISABLE_SENTENCE_TRANSFORMERS", "true").strip().lower() == "true"
)
