"""
Resume parsing endpoint — PDF → structured data.
Full implementation in Phase 4.
"""

from fastapi import APIRouter, UploadFile, File

router = APIRouter()


@router.post("")
async def parse_resume(file: UploadFile = File(...)):
    """
    Parse a PDF resume and extract structured data.

    Returns:
        raw_text, skills[], experience_years, education
    """
    # TODO: Phase 4 — implement PyMuPDF + spaCy + regex parsing
    return {
        "raw_text": "",
        "skills": [],
        "experience_years": None,
        "education": None,
    }
