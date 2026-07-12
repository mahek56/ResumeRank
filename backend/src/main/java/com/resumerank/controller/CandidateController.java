package com.resumerank.controller;

import com.resumerank.dto.CandidateResponse;
import com.resumerank.dto.PageResponse;
import com.resumerank.entity.CandidateStatus;
import com.resumerank.entity.User;
import com.resumerank.exception.ValidationException;
import com.resumerank.service.CandidateService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST endpoints for candidate management.
 *
 * POST   /api/candidates                — upload resume (multipart)
 * GET    /api/candidates                — list with search/filter/sort/pagination
 * GET    /api/candidates/{id}           — single candidate
 * PATCH  /api/candidates/{id}/status    — single status update
 * PATCH  /api/candidates/bulk-status    — bulk status update
 * GET    /api/candidates/export         — CSV download (streamed)
 */
@RestController
@RequestMapping("/api/candidates")
@Validated
public class CandidateController {

    private static final Logger log = LoggerFactory.getLogger(CandidateController.class);

    private final CandidateService candidateService;

    public CandidateController(CandidateService candidateService) {
        this.candidateService = candidateService;
    }

    // -------------------------------------------------------------------------
    // POST /api/candidates — upload a resume
    // -------------------------------------------------------------------------

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CandidateResponse> upload(
            @RequestPart("file") MultipartFile file,
            @RequestPart("jobId") String jobId,
            @RequestPart("name") String name,
            @RequestPart(value = "email", required = false) String email,
            @AuthenticationPrincipal User actor) {

        UUID parsedJobId;
        try {
            parsedJobId = UUID.fromString(jobId.trim());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("jobId must be a valid UUID");
        }

        CandidateResponse result = candidateService.uploadAndProcess(
                parsedJobId, file, name.trim(), email, actor);

        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    // -------------------------------------------------------------------------
    // GET /api/candidates — paginated list
    // -------------------------------------------------------------------------

    @GetMapping
    public ResponseEntity<PageResponse<CandidateResponse>> list(
            @RequestParam UUID jobId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "composite_score") String sort,
            @RequestParam(defaultValue = "desc") String dir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @AuthenticationPrincipal User actor) {

        CandidateStatus statusFilter = parseStatus(status);
        Pageable pageable = buildPageable(sort, dir, page, Math.min(size, 100));

        return ResponseEntity.ok(
                candidateService.findByJob(jobId, search, statusFilter, actor, pageable));
    }

    // -------------------------------------------------------------------------
    // GET /api/candidates/{id}
    // -------------------------------------------------------------------------

    @GetMapping("/{id}")
    public ResponseEntity<CandidateResponse> getOne(
            @PathVariable UUID id,
            @AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(candidateService.findById(id, actor));
    }

    // -------------------------------------------------------------------------
    // PATCH /api/candidates/{id}/status
    // -------------------------------------------------------------------------

    @PatchMapping("/{id}/status")
    public ResponseEntity<CandidateResponse> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User actor) {

        String statusStr = body.get("status");
        if (statusStr == null || statusStr.isBlank()) {
            throw new ValidationException("status field is required");
        }
        CandidateStatus newStatus = parseMandatoryStatus(statusStr);
        return ResponseEntity.ok(candidateService.updateStatus(id, newStatus, actor));
    }

    // -------------------------------------------------------------------------
    // PATCH /api/candidates/bulk-status
    // -------------------------------------------------------------------------

    @PatchMapping("/bulk-status")
    public ResponseEntity<List<CandidateResponse>> bulkUpdateStatus(
            @RequestBody BulkStatusRequest body,
            @AuthenticationPrincipal User actor) {

        CandidateStatus newStatus = parseMandatoryStatus(body.getStatus());
        return ResponseEntity.ok(
                candidateService.bulkUpdateStatus(body.getCandidateIds(), newStatus, actor));
    }

    // -------------------------------------------------------------------------
    // GET /api/candidates/export — streamed CSV
    // -------------------------------------------------------------------------

    @GetMapping("/export")
    public ResponseEntity<StreamingResponseBody> export(
            @RequestParam UUID jobId,
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal User actor) {

        CandidateStatus statusFilter = parseStatus(status);
        List<CandidateResponse> rows = candidateService.findForExport(jobId, statusFilter, actor);

        StreamingResponseBody stream = outputStream -> {
            try (OutputStreamWriter writer = new OutputStreamWriter(outputStream, StandardCharsets.UTF_8);
                 CSVPrinter csv = new CSVPrinter(writer, CSVFormat.DEFAULT.builder()
                         .setHeader("name", "email", "composite_score", "semantic_score",
                                 "keyword_score", "matched_skills", "missing_skills",
                                 "status", "experience_years", "education")
                         .build())) {
                for (CandidateResponse r : rows) {
                    csv.printRecord(
                            r.getName(),
                            r.getEmail(),
                            r.getCompositeScore(),
                            r.getSemanticScore(),
                            r.getKeywordScore(),
                            r.getMatchedSkills() != null ? String.join("; ", r.getMatchedSkills()) : "",
                            r.getMissingSkills() != null ? String.join("; ", r.getMissingSkills()) : "",
                            r.getStatus(),
                            r.getExperienceYears(),
                            r.getEducation()
                    );
                }
                writer.flush();
            } catch (Exception e) {
                log.error("CSV export failed for job {}: {}", jobId, e.getMessage());
            }
        };

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"candidates-" + jobId + ".csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(stream);
    }

    // -------------------------------------------------------------------------
    // Inner DTO for bulk-status request body
    // -------------------------------------------------------------------------

    public static class BulkStatusRequest {
        @NotNull
        private List<UUID> candidateIds;
        @NotNull
        private String status;

        public List<UUID> getCandidateIds() { return candidateIds; }
        public void setCandidateIds(List<UUID> candidateIds) { this.candidateIds = candidateIds; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private CandidateStatus parseStatus(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return CandidateStatus.valueOf(s.toLowerCase());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid status value: " + s + ". Valid: pending, shortlisted, rejected");
        }
    }

    private CandidateStatus parseMandatoryStatus(String s) {
        CandidateStatus cs = parseStatus(s);
        if (cs == null) throw new ValidationException("status is required");
        return cs;
    }

    private Pageable buildPageable(String sortField, String dir, int page, int size) {
        // Allow-list sort fields — use explicit JPQL aliases 's' and 'c' defined in CandidateRepository
        String safeSort = switch (sortField.toLowerCase()) {
            case "composite_score" -> "s.compositeScore";
            case "name" -> "c.name";
            case "created_at" -> "c.createdAt";
            default -> "c.createdAt";
        };
        Sort.Direction direction = "asc".equalsIgnoreCase(dir)
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        // JpaSort allows bypassing property checks to use query aliases directly
        Sort sort = org.springframework.data.jpa.domain.JpaSort.unsafe(direction, safeSort)
                .and(org.springframework.data.jpa.domain.JpaSort.unsafe(Sort.Direction.ASC, "c.id"));
        return PageRequest.of(page, size, sort);
    }
}
