"""
ResumeRank AI Service — Resume parser.

Pipeline:
  1. PDF → raw text  (PyMuPDF / fitz)
  2. raw text → skills  (spaCy NER + regex against skill taxonomy)
  3. raw text → experience_years  (regex)
  4. raw text → education  (regex + spaCy ORG entities)
"""

from __future__ import annotations

import io
import re
import logging
from typing import Optional

from app.utils.skill_taxonomy import SKILL_MAP, normalize_skill_list

logger = logging.getLogger("resumerank.ai.parser")

# ---------------------------------------------------------------------------
# Regex patterns
# ---------------------------------------------------------------------------

# Matches "5 years", "5+ years", "5-7 years", "over 5 years", etc.
_EXP_PATTERNS = [
    re.compile(
        r"\b(\d{1,2})\+?\s*(?:to\s*\d{1,2}\s*)?years?\s+(?:of\s+)?(?:professional\s+)?experience\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bover\s+(\d{1,2})\s+years?\s+(?:of\s+)?experience\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(\d{1,2})\+\s*yrs?\b",
        re.IGNORECASE,
    ),
]

# Education degree keywords
_EDU_DEGREE_PATTERNS = [
    re.compile(
        r"\b(bachelor(?:'s)?(?:\s+of\s+\w+)?|b\.?s\.?|b\.?e\.?|b\.?tech\.?)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(master(?:'s)?(?:\s+of\s+\w+)?|m\.?s\.?|m\.?e\.?|m\.?tech\.?|m\.?b\.?a\.?)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(ph\.?d\.?|doctor(?:ate)?(?:\s+of\s+\w+)?)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(associate(?:'s)?(?:\s+degree)?)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(high\s+school\s+diploma|ged)\b",
        re.IGNORECASE,
    ),
]

# Degree priority (higher index = higher degree)
_DEGREE_PRIORITY = [
    "high school diploma", "ged", "associate",
    "bachelor", "b.s", "b.e", "b.tech",
    "master", "m.s", "m.e", "m.tech", "mba",
    "phd", "doctorate",
]


def _degree_rank(text: str) -> int:
    """Return a numeric rank for sorting education levels."""
    low = text.lower()
    for i, kw in enumerate(_DEGREE_PRIORITY):
        if kw in low:
            return i
    return -1


# ---------------------------------------------------------------------------
# PDF extraction
# ---------------------------------------------------------------------------

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract all text from a PDF byte stream using PyMuPDF."""
    try:
        import fitz  # PyMuPDF

        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        pages_text = []
        for page in doc:
            pages_text.append(page.get_text("text"))
        doc.close()
        return "\n".join(pages_text).strip()
    except Exception as exc:
        logger.error("PyMuPDF failed to extract text: %s", exc)
        return ""


# ---------------------------------------------------------------------------
# Skill extraction
# ---------------------------------------------------------------------------

def extract_skills(text: str, nlp=None) -> list[str]:
    """
    Extract skills from resume text.

    Strategy:
      1. Slide a 1, 2, and 3-gram window across all tokens.
      2. Normalize against SKILL_MAP (case-insensitive).
      3. Optionally use spaCy NER to capture additional ORG/PRODUCT entities
         that map to skills.

    Returns deduplicated list of canonical skill names.
    """
    found_raw: list[str] = []

    # -- Tokenize into lowercase words (preserve punctuation in n-grams) --
    tokens = re.split(r"\s+", text.lower())
    # Remove tokens that are pure punctuation or very short
    tokens = [t.strip(".,;:()[]{}\"'") for t in tokens]
    tokens = [t for t in tokens if len(t) > 1]

    n = len(tokens)
    for size in (1, 2, 3):
        for i in range(n - size + 1):
            gram = " ".join(tokens[i : i + size])
            if gram in SKILL_MAP:
                found_raw.append(gram)

    # -- spaCy NER pass (optional: only when model is available) --
    if nlp is not None:
        try:
            doc = nlp(text[:50_000])  # spaCy limit safety
            for ent in doc.ents:
                if ent.label_ in ("ORG", "PRODUCT"):
                    candidate = ent.text.lower().strip(".,;: ")
                    if candidate in SKILL_MAP:
                        found_raw.append(candidate)
        except Exception as exc:
            logger.warning("spaCy NER pass failed: %s", exc)

    return normalize_skill_list(found_raw)


# ---------------------------------------------------------------------------
# Experience extraction
# ---------------------------------------------------------------------------

def extract_experience_years(text: str) -> Optional[int]:
    """
    Extract years of experience using regex patterns.
    Returns the largest matched value (assumes candidates list total career
    experience, not just one role).
    """
    best = None
    for pattern in _EXP_PATTERNS:
        for match in pattern.finditer(text):
            try:
                years = int(match.group(1))
                if years > 40:  # sanity cap
                    continue
                if best is None or years > best:
                    best = years
            except (IndexError, ValueError):
                continue
    return best


# ---------------------------------------------------------------------------
# Education extraction
# ---------------------------------------------------------------------------

def extract_education(text: str, nlp=None) -> Optional[str]:
    """
    Extract the highest education level mentioned in the text.

    1. Run all degree regex patterns → collect matches.
    2. Sort by degree rank → return the highest.
    3. Try to append institution name via spaCy ORG entities near the degree.
    """
    found_degrees: list[str] = []
    for pattern in _EDU_DEGREE_PATTERNS:
        for match in pattern.finditer(text):
            found_degrees.append(match.group(0))

    if not found_degrees:
        return None

    # Pick the highest-ranked degree
    found_degrees.sort(key=lambda d: _degree_rank(d), reverse=True)
    best = found_degrees[0]

    # Try to find a nearby institution via spaCy
    if nlp is not None:
        try:
            doc = nlp(text[:50_000])
            for ent in doc.ents:
                if ent.label_ == "ORG":
                    edu_kws = ("university", "college", "institute", "school")
                    if any(kw in ent.text.lower() for kw in edu_kws):
                        return f"{best} — {ent.text}"
        except Exception as exc:
            logger.warning("spaCy org lookup for education failed: %s", exc)

    return best


# ---------------------------------------------------------------------------
# Email extraction
# ---------------------------------------------------------------------------

def extract_email(text: str) -> Optional[str]:
    """Extract email address using regex."""
    match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    return match.group(0) if match else None


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def parse_resume(pdf_bytes: bytes, nlp=None) -> dict:
    """
    Full parse pipeline.  Returns a dict matching ParseResponse schema.

    Args:
        pdf_bytes: Raw bytes of the uploaded PDF.
        nlp: Optional spaCy Language model (passed from app.state.nlp).

    Returns:
        {raw_text, skills, experience_years, education}
    """
    raw_text = extract_text_from_pdf(pdf_bytes)
    if not raw_text:
        logger.warning("No text extracted from PDF — possible image-only PDF")

    skills = extract_skills(raw_text, nlp=nlp) if raw_text else []
    experience_years = extract_experience_years(raw_text) if raw_text else None
    education = extract_education(raw_text, nlp=nlp) if raw_text else None
    email = extract_email(raw_text) if raw_text else None

    logger.debug(
        "Parsed resume: %d chars, %d skills, %s yrs exp, edu=%s",
        len(raw_text),
        len(skills),
        experience_years,
        education,
    )

    return {
        "raw_text": raw_text,
        "skills": skills,
        "experience_years": experience_years,
        "education": education,
        "email": email,
    }
