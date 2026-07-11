package com.resumerank.controller;

import com.resumerank.dto.PageResponse;
import com.resumerank.entity.AuditLog;
import com.resumerank.entity.User;
import com.resumerank.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Read-only audit log endpoint. No create/update/delete exposed.
 */
@RestController
@RequestMapping("/api/audit")
public class AuditController {

    private final AuditLogRepository auditLogRepository;

    public AuditController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping
    public ResponseEntity<PageResponse<Map<String, Object>>> query(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) UUID entityId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @AuthenticationPrincipal User user) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AuditLog> result;

        if (entityType != null && entityId != null) {
            result = auditLogRepository.findByEntityTypeAndEntityId(entityType, entityId, pageable);
        } else if (entityType != null) {
            result = auditLogRepository.findByEntityType(entityType, pageable);
        } else {
            // Default: show the current user's actions only
            result = auditLogRepository.findByActorId(user.getId(), pageable);
        }

        List<Map<String, Object>> content = result.getContent().stream()
                .map(this::toMap)
                .collect(Collectors.toList());

        return ResponseEntity.ok(new PageResponse<>(content, result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages(), result.isLast()));
    }

    private Map<String, Object> toMap(AuditLog log) {
        return Map.of(
                "id", log.getId(),
                "entityType", log.getEntityType(),
                "entityId", log.getEntityId(),
                "action", log.getAction(),
                "actorId", log.getActor().getId(),
                "meta", log.getMeta(),
                "createdAt", log.getCreatedAt().toString()
        );
    }
}
