package com.resumerank.controller;

import com.resumerank.dto.SkillRequest;
import com.resumerank.dto.SkillResponse;
import com.resumerank.entity.User;
import com.resumerank.service.SkillService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for Skill CRUD, nested under jobs.
 * All endpoints require authentication. Owner check via parent job in service layer.
 */
@RestController
@RequestMapping("/api/jobs/{jobId}/skills")
public class SkillController {

    private final SkillService skillService;

    public SkillController(SkillService skillService) {
        this.skillService = skillService;
    }

    @GetMapping
    public ResponseEntity<List<SkillResponse>> list(@PathVariable UUID jobId,
                                                    @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(skillService.findByJobId(jobId, user));
    }

    @PostMapping
    public ResponseEntity<SkillResponse> create(@PathVariable UUID jobId,
                                                @Valid @RequestBody SkillRequest request,
                                                @AuthenticationPrincipal User user) {
        return ResponseEntity.status(201).body(skillService.create(jobId, request, user));
    }

    @PutMapping("/{skillId}")
    public ResponseEntity<SkillResponse> update(@PathVariable UUID jobId,
                                                @PathVariable UUID skillId,
                                                @Valid @RequestBody SkillRequest request,
                                                @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(skillService.update(jobId, skillId, request, user));
    }

    @DeleteMapping("/{skillId}")
    public ResponseEntity<Void> delete(@PathVariable UUID jobId,
                                       @PathVariable UUID skillId,
                                       @AuthenticationPrincipal User user) {
        skillService.delete(jobId, skillId, user);
        return ResponseEntity.noContent().build();
    }

    /**
     * Bulk replace all skills for a job at once.
     * Used by the frontend skill editor that sends the complete list.
     */
    @PutMapping
    public ResponseEntity<List<SkillResponse>> bulkReplace(
            @PathVariable UUID jobId,
            @Valid @RequestBody List<SkillRequest> requests,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(skillService.bulkReplace(jobId, requests, user));
    }
}
