-- ============================================================
-- V2: Create jobs and skills tables
-- Jobs belong to a user (owner_id). Skills belong to a job
-- with a configurable weight for scoring.
-- ============================================================

CREATE TABLE jobs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id    UUID         NOT NULL REFERENCES users(id),
    title       VARCHAR(255) NOT NULL,
    description TEXT         NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_owner ON jobs(owner_id);

CREATE TABLE skills (
    id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID         NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    name   VARCHAR(100) NOT NULL,
    weight REAL         NOT NULL DEFAULT 1.0,
    UNIQUE(job_id, name)
);

CREATE INDEX idx_skills_job ON skills(job_id);
