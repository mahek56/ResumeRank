"""
ResumeRank AI Service — /interview-summary endpoint (Phase 13 bonus).

Stubbed: returns a placeholder response. Full implementation in Phase 13
will call an LLM API (e.g. Groq / Llama 3) to generate strengths,
weaknesses, and a hiring recommendation.
"""

from fastapi import APIRouter

from app.models.schemas import InterviewSummaryRequest, InterviewSummaryResponse

router = APIRouter()


@router.post(
    "",
    response_model=InterviewSummaryResponse,
    summary="Generate an AI interview summary (Phase 13 — stub)",
    description=(
        "Stubbed endpoint. In Phase 13 this will call an LLM to generate "
        "a hiring recommendation, strengths, and weaknesses for the candidate."
    ),
)
async def interview_summary(body: InterviewSummaryRequest) -> InterviewSummaryResponse:
    # TODO Phase 13 — call Groq / Llama 3 with prompt built from body
    return InterviewSummaryResponse(
        strengths="LLM-generated strengths will appear here in Phase 13.",
        weaknesses="LLM-generated weaknesses will appear here in Phase 13.",
        recommendation=(
            f"Based on a composite score of {body.composite_score:.0f}/100, "
            "detailed AI analysis coming in Phase 13."
        ),
    )
