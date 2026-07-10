-- ============================================================
-- V1: Create users table
-- Auto-verified (demo mode) — email_verified defaults to TRUE.
-- This is a known scope cut for MVP, not an oversight.
-- See README "Known Limitations" section.
-- ============================================================

CREATE TABLE users (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    email_verified BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
