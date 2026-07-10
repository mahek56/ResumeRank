"""
Scoring endpoint — resume + job description → match scores.
Full implementation in Phase 4.
"""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class SkillWeight(BaseModel):
    name: str
    weight: float = 1.0


class ScoreRequest(BaseModel):
    job_description: str
    job_skills: list[SkillWeight]
    resume_text: str
    candidate_skills: list[str]


@router.post("")
async def score_candidate(request: ScoreRequest):
    """
    Score a candidate against a job description.

    Returns:
        composite_score, semantic_score, keyword_score,
        matched_skills, missing_skills, scoring_method
    """
    # TODO: Phase 4 — implement sentence-transformers + TF-IDF fallback scoring
    return {
        "composite_score": 0.0,
        "semantic_score": 0.0,
        "keyword_score": 0.0,
        "matched_skills": [],
        "missing_skills": [],
        "scoring_method": "stub",
    }
