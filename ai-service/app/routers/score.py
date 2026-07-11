"""
ResumeRank AI Service — /score endpoint.

Accepts a scoring request (JD + skills + resume text + candidate skills),
runs semantic + keyword scoring, and returns a structured score response.
Internal endpoint — called by Spring Boot only.
"""

from fastapi import APIRouter, HTTPException, Request, status

from app.models.schemas import ScoreRequest, ScoreResponse
from app.services.scorer import score_candidate

router = APIRouter()


@router.post(
    "",
    response_model=ScoreResponse,
    summary="Score a candidate against a job description",
    description=(
        "Computes a composite match score (0–100) for a candidate resume "
        "against a job description. Uses sentence-transformers for semantic "
        "similarity and weighted fuzzy matching for keyword coverage. Falls "
        "back to TF-IDF cosine similarity if the embedding model is unavailable."
    ),
)
async def score_candidate_endpoint(
    request: Request,
    body: ScoreRequest,
) -> ScoreResponse:
    if not body.job_description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="job_description must not be empty.",
        )
    if not body.resume_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="resume_text must not be empty.",
        )

    # -- Retrieve model state from app --
    scoring_method: str = getattr(request.app.state, "scoring_method", "tfidf")
    embedding_model = getattr(request.app.state, "embedding_model", None)

    # -- Convert pydantic SkillWeight objects to plain dicts for scorer --
    job_skills_dicts = [
        {"name": s.name, "weight": s.weight}
        for s in body.job_skills
    ]

    # -- Run scoring pipeline --
    try:
        result = score_candidate(
            job_description=body.job_description,
            job_skills=job_skills_dicts,
            resume_text=body.resume_text,
            candidate_skills=body.candidate_skills,
            scoring_method=scoring_method,
            embedding_model=embedding_model,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Scoring failed. Please try again.",
        ) from exc

    return ScoreResponse(**result)
