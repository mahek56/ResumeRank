package com.resumerank.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumerank.aiservice.AiServiceClient;
import com.resumerank.dto.AiScoreRequest;
import com.resumerank.dto.AiScoreResponse;
import com.resumerank.dto.CandidateResponse;
import com.resumerank.dto.CandidateUploadRequest;
import com.resumerank.dto.PageResponse;
import com.resumerank.dto.ParseResponse;
import com.resumerank.entity.Candidate;
import com.resumerank.entity.CandidateSkill;
import com.resumerank.entity.CandidateStatus;
import com.resumerank.entity.Job;
import com.resumerank.entity.Score;
import com.resumerank.entity.Skill;
import com.resumerank.entity.User;
import com.resumerank.exception.ForbiddenException;
import com.resumerank.exception.NotFoundException;
import com.resumerank.exception.ValidationException;
import com.resumerank.repository.CandidateRepository;
import com.resumerank.repository.CandidateSkillRepository;
import com.resumerank.repository.ScoreRepository;
import com.resumerank.storage.StorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Orchestrates the full candidate upload-parse-score-persist flow.
 *
 * Upload pipeline (uploadAndProcess):
 *   1. Validate PDF (delegated to LocalStorageService)
 *   2. Store file → get relative path
 *   3. POST to AI /parse-resume → raw text + skills + exp + edu
 *   4. Persist Candidate + CandidateSkill rows
 *   5. POST to AI /score → composite/semantic/keyword scores
 *   6. Persist Score
 *   7. Write AuditLog entry
 *   8. Return full CandidateResponse
 *
 * Every mutation verifies the acting user owns the candidate's job.
 */
@Service
public class CandidateService {

    private static final Logger log = LoggerFactory.getLogger(CandidateService.class);

    private final CandidateRepository candidateRepository;
    private final CandidateSkillRepository candidateSkillRepository;
    private final ScoreRepository scoreRepository;
    private final JobService jobService;
    private final StorageService storageService;
    private final AiServiceClient aiServiceClient;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    public CandidateService(CandidateRepository candidateRepository,
                            CandidateSkillRepository candidateSkillRepository,
                            ScoreRepository scoreRepository,
                            JobService jobService,
                            StorageService storageService,
                            AiServiceClient aiServiceClient,
                            AuditService auditService,
                            ObjectMapper objectMapper) {
        this.candidateRepository = candidateRepository;
        this.candidateSkillRepository = candidateSkillRepository;
        this.scoreRepository = scoreRepository;
        this.jobService = jobService;
        this.storageService = storageService;
        this.aiServiceClient = aiServiceClient;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    // -------------------------------------------------------------------------
    // Upload & Process
    // -------------------------------------------------------------------------

    /**
     * Full upload pipeline: validate → store → parse → persist → score → persist → audit.
     *
     * Note: @Transactional is intentionally NOT on this method because the file
     * store and two external HTTP calls happen in the middle. DB operations
     * are isolated in the two inner @Transactional helpers below.
     */
    public CandidateResponse uploadAndProcess(UUID jobId,
                                              MultipartFile file,
                                              String candidateName,
                                              String candidateEmail,
                                              User actor) {
        // Step 1 — verify job exists and actor owns it
        Job job = jobService.getJobWithSkillsOrThrow(jobId);
        jobService.assertOwner(job, actor);

        // Step 2 — read bytes once (InputStream can only be consumed once)
        byte[] pdfBytes;
        try {
            pdfBytes = file.getBytes();
        } catch (Exception e) {
            throw new RuntimeException("Failed to read uploaded file: " + e.getMessage(), e);
        }

        // Store the PDF (validates MIME + size internally)
        String subPath = "jobs/" + jobId;
        String filePath = storageService.store(file, subPath);
        log.debug("Stored resume at: {}", filePath);

        // Step 3 — call AI parse
        ParseResponse parsed;
        try {
            parsed = aiServiceClient.parseResume(
                    file.getOriginalFilename() != null ? file.getOriginalFilename() : "resume.pdf",
                    pdfBytes
            );
        } catch (Exception e) {
            // Clean up stored file on parse failure
            storageService.delete(filePath);
            throw new RuntimeException("Resume parsing failed — file removed. " + e.getMessage(), e);
        }

        // Step 4 — persist Candidate + CandidateSkills
        Candidate candidate = persistCandidate(job, candidateName, candidateEmail,
                filePath, parsed);

        // Step 5 — build score request from parsed data + job
        List<AiScoreRequest.SkillWeight> jobSkills = job.getSkills().stream()
                .map(s -> new AiScoreRequest.SkillWeight(s.getName(), s.getWeight()))
                .collect(Collectors.toList());

        AiScoreRequest scoreRequest = new AiScoreRequest(
                job.getDescription(),
                jobSkills,
                parsed.getRawText() != null ? parsed.getRawText() : "",
                parsed.getSkills() != null ? parsed.getSkills() : List.of()
        );

        // Step 6 — call AI score
        AiScoreResponse scoreResult;
        try {
            scoreResult = aiServiceClient.scoreCandidate(scoreRequest);
        } catch (Exception e) {
            log.error("Scoring failed for candidate {}: {}", candidate.getId(), e.getMessage());
            // Candidate is persisted; return partial response without score
            auditService.log("Candidate", candidate.getId(), "UPLOADED_SCORE_FAILED", actor,
                    "{\"error\":\"" + e.getMessage() + "\"}");
            return toResponse(candidate, null);
        }

        // Step 7 — persist Score
        Score score = persistScore(candidate, scoreResult);

        // Step 8 — audit
        auditService.log("Candidate", candidate.getId(), "UPLOADED", actor, null);

        return toResponse(candidate, score);
    }

    @Transactional
    protected Candidate persistCandidate(Job job, String name, String email,
                                         String filePath, ParseResponse parsed) {
        Candidate candidate = new Candidate(job, name, filePath);
        if (email != null && !email.isBlank()) {
            candidate.setEmail(email.trim());
        }
        candidate.setRawText(parsed.getRawText());
        candidate.setExperienceYears(parsed.getExperienceYears());
        candidate.setEducation(parsed.getEducation());
        candidate = candidateRepository.save(candidate);

        // Persist candidate skills
        List<String> skills = parsed.getSkills() != null ? parsed.getSkills() : List.of();
        if (!skills.isEmpty()) {
            final Candidate savedCandidate = candidate;
            List<CandidateSkill> skillEntities = skills.stream()
                    .map(skillName -> new CandidateSkill(savedCandidate, skillName, false))
                    .collect(Collectors.toList());
            candidateSkillRepository.saveAll(skillEntities);
        }

        log.debug("Persisted candidate {} with {} skills", candidate.getId(), skills.size());
        return candidate;
    }

    @Transactional
    protected Score persistScore(Candidate candidate, AiScoreResponse result) {
        Score score = new Score(
                candidate,
                result.getCompositeScore(),
                result.getSemanticScore(),
                result.getKeywordScore(),
                result.getScoringMethod() != null ? result.getScoringMethod() : "tfidf",
                result.getMatchedSkills() != null ? result.getMatchedSkills() : List.of(),
                result.getMissingSkills() != null ? result.getMissingSkills() : List.of()
        );
        // Update matched flag on CandidateSkill rows
        Set<String> matchedSet = result.getMatchedSkills() != null
                ? result.getMatchedSkills().stream().map(String::toLowerCase).collect(Collectors.toSet())
                : Set.of();
        if (!matchedSet.isEmpty()) {
            candidateSkillRepository.findByCandidate(candidate).stream()
                    .filter(cs -> matchedSet.contains(cs.getName().toLowerCase()))
                    .forEach(cs -> {
                        cs.setMatched(true);
                        candidateSkillRepository.save(cs);
                    });
        }
        return scoreRepository.save(score);
    }

    // -------------------------------------------------------------------------
    // List / Read
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public PageResponse<CandidateResponse> findByJob(UUID jobId,
                                                      String search,
                                                      CandidateStatus status,
                                                      User actor,
                                                      Pageable pageable) {
        Job job = jobService.getJobOrThrow(jobId);
        jobService.assertOwner(job, actor);

        boolean hasSearch = search != null && !search.isBlank();
        String safeSearch = hasSearch ? search.trim() : "";
        boolean hasStatus = status != null;
        CandidateStatus safeStatus = hasStatus ? status : CandidateStatus.pending;

        Page<Candidate> page = candidateRepository.findByJobIdFiltered(
                jobId, hasSearch, safeSearch, hasStatus, safeStatus, pageable);

        List<CandidateResponse> content = page.getContent().stream()
                .map(c -> toResponse(c, scoreRepository.findByCandidateId(c.getId()).orElse(null)))
                .collect(Collectors.toList());

        return new PageResponse<>(content, page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages(), page.isLast());
    }

    @Transactional(readOnly = true)
    public CandidateResponse findById(UUID candidateId, User actor) {
        Candidate candidate = getCandidateOrThrow(candidateId);
        assertOwner(candidate, actor);
        Score score = scoreRepository.findByCandidateId(candidateId).orElse(null);
        return toResponse(candidate, score);
    }

    // -------------------------------------------------------------------------
    // Status updates
    // -------------------------------------------------------------------------

    @Transactional
    public CandidateResponse updateStatus(UUID candidateId, CandidateStatus newStatus, User actor) {
        Candidate candidate = getCandidateOrThrow(candidateId);
        assertOwner(candidate, actor);

        CandidateStatus old = candidate.getStatus();
        candidate.setStatus(newStatus);
        candidate = candidateRepository.save(candidate);

        auditService.log("Candidate", candidateId, "STATUS_CHANGED", actor,
                "{\"from\":\"" + old + "\",\"to\":\"" + newStatus + "\"}");

        Score score = scoreRepository.findByCandidateId(candidateId).orElse(null);
        return toResponse(candidate, score);
    }

    @Transactional
    public List<CandidateResponse> bulkUpdateStatus(List<UUID> candidateIds,
                                                     CandidateStatus newStatus,
                                                     User actor) {
        if (candidateIds == null || candidateIds.isEmpty()) {
            throw new ValidationException("candidateIds must not be empty");
        }

        List<Candidate> candidates = candidateRepository.findAllByIdWithJob(candidateIds);

        if (candidates.size() != candidateIds.size()) {
            throw new NotFoundException("One or more candidates not found");
        }

        // Validate all belong to jobs owned by the actor
        for (Candidate c : candidates) {
            assertOwner(c, actor);
        }

        List<CandidateResponse> results = new ArrayList<>();
        for (Candidate c : candidates) {
            CandidateStatus old = c.getStatus();
            c.setStatus(newStatus);
            candidateRepository.save(c);
            auditService.log("Candidate", c.getId(), "STATUS_CHANGED", actor,
                    "{\"from\":\"" + old + "\",\"to\":\"" + newStatus + "\"}");
            Score score = scoreRepository.findByCandidateId(c.getId()).orElse(null);
            results.add(toResponse(c, score));
        }
        return results;
    }

    // -------------------------------------------------------------------------
    // Export support (raw data, controller handles CSV formatting)
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<CandidateResponse> findForExport(UUID jobId, CandidateStatus status, User actor) {
        Job job = jobService.getJobOrThrow(jobId);
        jobService.assertOwner(job, actor);

        return candidateRepository.findByJobIdForExport(jobId, status).stream()
                .map(c -> toResponse(c, scoreRepository.findByCandidateId(c.getId()).orElse(null)))
                .collect(Collectors.toList());
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    public Candidate getCandidateOrThrow(UUID candidateId) {
        return candidateRepository.findByIdWithJob(candidateId)
                .orElseThrow(() -> new NotFoundException("Candidate", candidateId));
    }

    public void assertOwner(Candidate candidate, User actor) {
        if (!candidate.getJob().getOwner().getId().equals(actor.getId())) {
            throw new ForbiddenException("You do not own this candidate's job");
        }
    }

    public CandidateResponse toResponse(Candidate c, Score score) {
        CandidateResponse r = new CandidateResponse();
        r.setId(c.getId());
        r.setJobId(c.getJob().getId());
        r.setName(c.getName());
        r.setEmail(c.getEmail());
        r.setResumeFileUrl(c.getResumeFileUrl());
        r.setExperienceYears(c.getExperienceYears());
        r.setEducation(c.getEducation());
        r.setStatus(c.getStatus().name().toLowerCase());
        r.setCreatedAt(c.getCreatedAt());

        if (score != null) {
            r.setCompositeScore(score.getCompositeScore());
            r.setSemanticScore(score.getSemanticScore());
            r.setKeywordScore(score.getKeywordScore());
            r.setScoringMethod(score.getScoringMethod());
            r.setMatchedSkills(score.getMatchedSkills());
            r.setMissingSkills(score.getMissingSkills());
        }
        return r;
    }


}
