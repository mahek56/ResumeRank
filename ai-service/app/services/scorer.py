"""
ResumeRank AI Service — Candidate scorer.

Scoring pipeline:
  1. Semantic score  — sentence-transformers (primary) or TF-IDF cosine (fallback)
  2. Keyword score   — weighted fuzzy match of job skills vs candidate skills
  3. Composite       — 0.6 × semantic + 0.4 × keyword

The scoring_method passed in determines which path to run.
"""

from __future__ import annotations

import logging
import math
from typing import Optional

logger = logging.getLogger("resumerank.ai.scorer")

# Fuzzy-match threshold (token-set ratio, 0–100)
_FUZZY_THRESHOLD = 80


# ---------------------------------------------------------------------------
# Semantic scoring
# ---------------------------------------------------------------------------

def _cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """Pure-Python cosine similarity (used for TF-IDF vectors)."""
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def semantic_score_transformers(
    job_description: str,
    resume_text: str,
    model,
) -> float:
    """
    Compute semantic similarity via sentence-transformers.

    Returns a score in [0, 100].
    """
    try:
        import numpy as np

        embeddings = model.encode(
            [job_description, resume_text],
            convert_to_numpy=True,
            normalize_embeddings=True,
        )
        # With normalized embeddings, dot product == cosine similarity
        sim = float(np.dot(embeddings[0], embeddings[1]))
        # Cosine is in [-1, 1]; clamp to [0, 1] then scale to [0, 100]
        return round(max(0.0, min(1.0, sim)) * 100, 2)
    except Exception as exc:
        logger.error("sentence-transformers scoring failed: %s", exc)
        return 0.0


def semantic_score_tfidf(
    job_description: str,
    resume_text: str,
) -> float:
    """
    TF-IDF cosine similarity fallback.

    Returns a score in [0, 100].
    """
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer

        corpus = [job_description, resume_text]
        vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=5000,
            sublinear_tf=True,
        )
        tfidf_matrix = vectorizer.fit_transform(corpus)

        # scipy sparse → dense for cosine computation
        vec_job = tfidf_matrix[0].toarray()[0].tolist()
        vec_res = tfidf_matrix[1].toarray()[0].tolist()

        sim = _cosine_similarity(vec_job, vec_res)
        return round(max(0.0, min(1.0, sim)) * 100, 2)
    except Exception as exc:
        logger.error("TF-IDF scoring failed: %s", exc)
        return 0.0


# ---------------------------------------------------------------------------
# Keyword scoring — weighted fuzzy match
# ---------------------------------------------------------------------------

def _fuzzy_token_set_ratio(s1: str, s2: str) -> int:
    """
    Lightweight token set ratio (0-100) without the full rapidfuzz dependency.
    Computes overlap of token sets normalized to the shorter string.
    """
    tokens_a = set(s1.lower().split())
    tokens_b = set(s2.lower().split())
    if not tokens_a or not tokens_b:
        return 0
    # intersection = tokens_a & tokens_b
    # union = tokens_a | tokens_b
    # # Jaccard on token sets × 100
    # return round(len(intersection) / smaller * 100)
    intersection = tokens_a & tokens_b
    smaller = min(len(tokens_a), len(tokens_b))
    return round(len(intersection) / smaller * 100)


def keyword_score(
    job_skills: list[dict],      # [{"name": str, "weight": float}]
    candidate_skills: list[str],
) -> tuple[float, list[str], list[str]]:
    """
    Compute keyword coverage score.

    For each job skill, fuzzy-match against all candidate skills.
    A job skill is "matched" if any candidate skill exceeds _FUZZY_THRESHOLD.

    Returns:
        (keyword_score_0_100, matched_skill_names, missing_skill_names)
    """
    if not job_skills:
        return 0.0, [], []

    total_weight = sum(s.get("weight", 1.0) for s in job_skills)
    if total_weight == 0:
        return 0.0, [], []

    matched: list[str] = []
    missing: list[str] = []
    matched_weight = 0.0

    for skill_obj in job_skills:
        skill_name: str = skill_obj.get("name", "")
        weight: float = skill_obj.get("weight", 1.0)

        # Check against each candidate skill
        is_matched = False
        for cand_skill in candidate_skills:
            ratio = _fuzzy_token_set_ratio(skill_name, cand_skill)
            if ratio >= _FUZZY_THRESHOLD:
                is_matched = True
                break

        if is_matched:
            matched.append(skill_name)
            matched_weight += weight
        else:
            missing.append(skill_name)

    score = round((matched_weight / total_weight) * 100, 2)
    return score, matched, missing


# ---------------------------------------------------------------------------
# Composite scoring
# ---------------------------------------------------------------------------

SEMANTIC_WEIGHT = 0.6
KEYWORD_WEIGHT = 0.4


def score_candidate(
    job_description: str,
    job_skills: list[dict],
    resume_text: str,
    candidate_skills: list[str],
    scoring_method: str,
    embedding_model=None,
) -> dict:
    """
    Full scoring pipeline.

    Args:
        job_description: Full JD text.
        job_skills: List of {"name": str, "weight": float} dicts.
        resume_text: Raw resume text (extracted by parser).
        candidate_skills: Skills extracted from the resume.
        scoring_method: "sentence-transformers" | "tfidf"
        embedding_model: SentenceTransformer instance or None.

    Returns dict matching ScoreResponse schema.
    """
    if not resume_text:
        logger.warning("Empty resume text passed to scorer — returning zeros")
        return {
            "composite_score": 0.0,
            "semantic_score": 0.0,
            "keyword_score": 0.0,
            "matched_skills": [],
            "missing_skills": [s.get("name", "") for s in job_skills],
            "scoring_method": scoring_method,
        }

    # -- Semantic score --
    if scoring_method == "sentence-transformers" and embedding_model is not None:
        sem_score = semantic_score_transformers(
            job_description, resume_text, embedding_model
        )
    else:
        scoring_method = "tfidf"  # normalise in case model was None
        sem_score = semantic_score_tfidf(job_description, resume_text)

    # -- Keyword score --
    kw_score, matched, missing = keyword_score(job_skills, candidate_skills)

    # -- Composite --
    composite = round(SEMANTIC_WEIGHT * sem_score + KEYWORD_WEIGHT * kw_score, 2)

    logger.debug(
        "Scored: composite=%.1f semantic=%.1f keyword=%.1f method=%s "
        "matched=%d/%d skills",
        composite,
        sem_score,
        kw_score,
        scoring_method,
        len(matched),
        len(job_skills),
    )

    return {
        "composite_score": composite,
        "semantic_score": sem_score,
        "keyword_score": kw_score,
        "matched_skills": matched,
        "missing_skills": missing,
        "scoring_method": scoring_method,
    }
