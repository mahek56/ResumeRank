"""
ResumeRank AI Service — Pydantic request/response schemas.

All endpoint contracts are defined here so routers and services
share a single source of truth.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Parse schemas
# ---------------------------------------------------------------------------

class ParseResponse(BaseModel):
    """Structured data extracted from a resume PDF."""

    raw_text: str = Field(description="Full text extracted from the PDF")
    skills: list[str] = Field(
        default_factory=list,
        description="Normalized skill names found in the resume",
    )
    experience_years: Optional[int] = Field(
        default=None,
        description="Total years of experience (best-effort regex extraction)",
    )
    education: Optional[str] = Field(
        default=None,
        description="Highest detected education level / degree string",
    )


# ---------------------------------------------------------------------------
# Score schemas
# ---------------------------------------------------------------------------

class SkillWeight(BaseModel):
    """A job-required skill with its relative importance weight."""

    name: str
    weight: float = Field(default=1.0, ge=0.0)


class ScoreRequest(BaseModel):
    """Input for the scoring endpoint."""

    job_description: str = Field(description="Full job description text")
    job_skills: list[SkillWeight] = Field(
        default_factory=list,
        description="Required skills with weights",
    )
    resume_text: str = Field(description="Raw text extracted from the resume")
    candidate_skills: list[str] = Field(
        default_factory=list,
        description="Skills extracted from the resume",
    )


class ScoreResponse(BaseModel):
    """Scoring result returned to the Spring Boot backend."""

    composite_score: float = Field(ge=0.0, le=100.0)
    semantic_score: float = Field(ge=0.0, le=100.0)
    keyword_score: float = Field(ge=0.0, le=100.0)
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    scoring_method: str = Field(
        description="'sentence-transformers' or 'tfidf'"
    )


# ---------------------------------------------------------------------------
# Interview summary (bonus — stubbed until Phase 13)
# ---------------------------------------------------------------------------

class InterviewSummaryRequest(BaseModel):
    candidate_name: str
    resume_text: str
    job_description: str
    composite_score: float
    matched_skills: list[str]
    missing_skills: list[str]


class InterviewSummaryResponse(BaseModel):
    strengths: str
    weaknesses: str
    recommendation: str
