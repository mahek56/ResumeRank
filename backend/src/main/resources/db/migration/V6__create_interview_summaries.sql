-- ============================================================
-- V6: Create interview_summaries table (bonus feature)
-- Created now for schema completeness. The LLM-generated
-- interview summary feature is optional (Phase 13 bonus).
-- App works without this table populated.
-- ============================================================

CREATE TABLE interview_summaries (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id   UUID NOT NULL UNIQUE REFERENCES candidates(id) ON DELETE CASCADE,
    strengths      TEXT,
    weaknesses     TEXT,
    recommendation TEXT,
    generated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
