package com.resumerank.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Maps to the 'audit_logs' table (V5 migration).
 * Immutable append-only log. Every mutation is recorded with
 * who did it and when. No setters for id or createdAt.
 */
@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Column(name = "action", nullable = false, length = 100)
    private String action;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "actor_id", nullable = false)
    private User actor;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "meta", columnDefinition = "JSONB")
    private String meta = "{}";

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected AuditLog() {}

    public AuditLog(String entityType, UUID entityId, String action, User actor, String meta) {
        this.entityType = entityType;
        this.entityId = entityId;
        this.action = action;
        this.actor = actor;
        this.meta = meta != null ? meta : "{}";
        this.createdAt = OffsetDateTime.now();
    }

    // --- Getters only (immutable) ---

    public UUID getId() { return id; }
    public String getEntityType() { return entityType; }
    public UUID getEntityId() { return entityId; }
    public String getAction() { return action; }
    public User getActor() { return actor; }
    public String getMeta() { return meta; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
