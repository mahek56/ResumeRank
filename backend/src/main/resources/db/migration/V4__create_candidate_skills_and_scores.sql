-- ============================================================
-- V4: Create candidate_skills and scores tables
-- CandidateSkills: extracted skills per candidate, with a
--   'matched' flag indicating if it matched a job skill.
-- Scores: composite (60% semantic + 40% keyword), plus
--   individual breakdowns and the scoring method used.
-- ============================================================

CREATE TABLE candidate_skills (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID         NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    name         VARCHAR(100) NOT NULL,
    matched      BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_cskills_candidate ON candidate_skills(candidate_id);

CREATE TABLE scores (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id    UUID        NOT NULL UNIQUE REFERENCES candidates(id) ON DELETE CASCADE,
    composite_score REAL        NOT NULL,
    semantic_score  REAL        NOT NULL,
    keyword_score   REAL        NOT NULL,
    scoring_method  VARCHAR(50) NOT NULL DEFAULT 'sentence-transformers',
    matched_skills  JSONB       NOT NULL DEFAULT '[]',
    missing_skills  JSONB       NOT NULL DEFAULT '[]',
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
