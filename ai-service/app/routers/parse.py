"""
ResumeRank AI Service — /parse-resume endpoint.

Accepts a PDF file upload, runs the parse pipeline, and returns
structured candidate data. Internal endpoint — called by Spring Boot only.
"""

from fastapi import APIRouter, File, HTTPException, Request, UploadFile, status

from app.models.schemas import ParseResponse
from app.services.parser import parse_resume

router = APIRouter()

# Max acceptable file size (10 MB) — Spring Boot also enforces this,
# but we double-check here in case the AI service is called directly.
_MAX_PDF_BYTES = 10 * 1024 * 1024


@router.post(
    "",
    response_model=ParseResponse,
    summary="Parse a resume PDF",
    description=(
        "Accepts a PDF resume, extracts raw text via PyMuPDF, then runs "
        "spaCy NER + regex patterns to extract skills, experience, and "
        "education. Returns structured data for downstream scoring."
    ),
)
async def parse_resume_endpoint(
    request: Request,
    file: UploadFile = File(
        ...,
        description="PDF resume file (max 10 MB)",
    ),
) -> ParseResponse:
    # -- Validate content type --
    content_type = file.content_type or ""
    if content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Only PDF files are accepted. Got: {content_type}",
        )

    # -- Read and size-check the file --
    pdf_bytes = await file.read()
    if len(pdf_bytes) > _MAX_PDF_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds the 10 MB limit.",
        )
    if len(pdf_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    # -- Retrieve spaCy model from app state (may be None) --
    nlp = getattr(request.app.state, "nlp", None)

    # -- Run parse pipeline --
    try:
        result = parse_resume(pdf_bytes, nlp=nlp)
    except Exception as exc:
        # Log server-side; return a safe error to caller
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Resume parsing failed. Please try again.",
        ) from exc

    return ParseResponse(**result)
