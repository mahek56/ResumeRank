"""
ResumeRank AI Service — FastAPI application entry point.

Handles resume parsing (PDF → structured data) and scoring
(semantic + keyword matching). Internal service called by
the Spring Boot backend — no auth on these endpoints.
"""

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI

from app.config import settings
from app.routers import parse, score

logger = logging.getLogger("resumerank.ai")


# -- Lifespan: load models on startup, release on shutdown --

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load NLP and embedding models at startup."""
    logger.info("Starting ResumeRank AI Service...")

    # Load spaCy model
    try:
        import spacy
        app.state.nlp = spacy.load("en_core_web_sm")
        logger.info("spaCy model 'en_core_web_sm' loaded successfully.")
    except OSError:
        logger.error(
            "spaCy model 'en_core_web_sm' not found. "
            "Install it with: python -m spacy download en_core_web_sm"
        )
        app.state.nlp = None

    # Load sentence-transformers model (primary scorer)
    # Falls back to TF-IDF if this fails (e.g., OOM on free-tier)
    app.state.scoring_method = "tfidf"  # default fallback
    app.state.embedding_model = None

    try:
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer("all-MiniLM-L6-v2")
        app.state.embedding_model = model
        app.state.scoring_method = "sentence-transformers"
        logger.info(
            "Sentence-transformers model 'all-MiniLM-L6-v2' loaded. "
            "Scoring method: sentence-transformers"
        )
    except Exception as e:
        logger.warning(
            f"Failed to load sentence-transformers model: {e}. "
            "Falling back to TF-IDF cosine similarity."
        )

    logger.info(f"Active scoring method: {app.state.scoring_method}")

    yield

    # Cleanup
    logger.info("Shutting down ResumeRank AI Service.")


# -- FastAPI app --

app = FastAPI(
    title="ResumeRank AI Service",
    description="Internal AI service for resume parsing and candidate scoring.",
    version="1.0.0",
    lifespan=lifespan,
)

# Register routers
app.include_router(parse.router, prefix="/parse-resume", tags=["Parse"])
app.include_router(score.router, prefix="/score", tags=["Score"])


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check returning model status and active scoring method."""
    return {
        "status": "healthy",
        "scoring_method": app.state.scoring_method,
        "spacy_loaded": app.state.nlp is not None,
        "embedding_model_loaded": app.state.embedding_model is not None,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=True,
    )
