-- ============================================================
-- V3: Create candidates table
-- Candidates belong to a job. Status enum: pending (default),
-- shortlisted, rejected. Recruiter sets status manually —
-- tool never auto-rejects.
-- ============================================================

CREATE TYPE candidate_status AS ENUM ('pending', 'shortlisted', 'rejected');

CREATE TABLE candidates (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id           UUID              NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    name             VARCHAR(255)      NOT NULL,
    email            VARCHAR(255),
    resume_file_url  TEXT              NOT NULL,
    raw_text         TEXT,
    experience_years INTEGER,
    education        TEXT,
    status           candidate_status  NOT NULL DEFAULT 'pending',
    created_at       TIMESTAMPTZ       NOT NULL DEFAULT now()
);

CREATE INDEX idx_candidates_job    ON candidates(job_id);
CREATE INDEX idx_candidates_status ON candidates(job_id, status);
