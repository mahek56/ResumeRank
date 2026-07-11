package com.resumerank.service;

import com.resumerank.entity.AuditLog;
import com.resumerank.entity.User;
import com.resumerank.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Insert-only audit logging service.
 * Called from service layer on every mutation (create/update/delete).
 * Never exposes update/delete operations.
 */
@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Record an audit log entry.
     *
     * @param entityType e.g. "Job", "Skill", "Candidate"
     * @param entityId   the UUID of the affected entity
     * @param action     e.g. "CREATED", "UPDATED", "DELETED", "STATUS_CHANGED"
     * @param actor      the user who performed the action
     * @param meta       optional JSON metadata (e.g. old/new values), may be null
     */
    public void log(String entityType, UUID entityId, String action, User actor, String meta) {
        AuditLog entry = new AuditLog(entityType, entityId, action, actor, meta);
        auditLogRepository.save(entry);
        log.debug("Audit: {} {} {} by user {}", action, entityType, entityId, actor.getId());
    }
}
