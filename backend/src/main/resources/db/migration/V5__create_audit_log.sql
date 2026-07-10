-- ============================================================
-- V5: Create audit_logs table
-- Immutable append-only log. Every mutation (score computed,
-- status changed, job created/updated/deleted) is recorded
-- with who did it and when.
-- ============================================================

CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50)  NOT NULL,
    entity_id   UUID         NOT NULL,
    action      VARCHAR(100) NOT NULL,
    actor_id    UUID         NOT NULL REFERENCES users(id),
    meta        JSONB                 DEFAULT '{}',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_actor  ON audit_logs(actor_id);
