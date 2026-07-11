package com.resumerank.service;

import com.resumerank.dto.JobRequest;
import com.resumerank.dto.JobResponse;
import com.resumerank.dto.PageResponse;
import com.resumerank.dto.SkillResponse;
import com.resumerank.entity.Job;
import com.resumerank.entity.User;
import com.resumerank.exception.ForbiddenException;
import com.resumerank.exception.NotFoundException;
import com.resumerank.repository.JobRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Business logic for Job CRUD. Every mutation verifies row-level ownership.
 */
@Service
public class JobService {

    private final JobRepository jobRepository;
    private final AuditService auditService;

    public JobService(JobRepository jobRepository, AuditService auditService) {
        this.jobRepository = jobRepository;
        this.auditService = auditService;
    }

    @Transactional
    public JobResponse create(JobRequest request, User owner) {
        Job job = new Job(owner, request.getTitle(), request.getDescription());
        job = jobRepository.save(job);

        auditService.log("Job", job.getId(), "CREATED", owner, null);
        return toResponse(job);
    }

    @Transactional(readOnly = true)
    public PageResponse<JobResponse> findByOwner(UUID ownerId, Pageable pageable) {
        Page<Job> page = jobRepository.findByOwnerId(ownerId, pageable);
        List<JobResponse> content = page.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return new PageResponse<>(content, page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages(), page.isLast());
    }

    @Transactional(readOnly = true)
    public JobResponse findById(UUID jobId, User currentUser) {
        Job job = getJobOrThrow(jobId);
        assertOwner(job, currentUser);
        return toResponse(job);
    }

    @Transactional
    public JobResponse update(UUID jobId, JobRequest request, User currentUser) {
        Job job = getJobOrThrow(jobId);
        assertOwner(job, currentUser);

        job.setTitle(request.getTitle());
        job.setDescription(request.getDescription());
        job.setUpdatedAt(OffsetDateTime.now());
        job = jobRepository.save(job);

        auditService.log("Job", job.getId(), "UPDATED", currentUser, null);
        return toResponse(job);
    }

    @Transactional
    public void delete(UUID jobId, User currentUser) {
        Job job = getJobOrThrow(jobId);
        assertOwner(job, currentUser);

        jobRepository.delete(job);
        auditService.log("Job", jobId, "DELETED", currentUser, null);
    }

    // --- Internal helpers ---

    /**
     * Load a Job by ID or throw NotFoundException.
     * Also used by SkillService to verify job existence.
     */
    public Job getJobOrThrow(UUID jobId) {
        return jobRepository.findById(jobId)
                .orElseThrow(() -> new NotFoundException("Job", jobId));
    }

    /**
     * Assert the current user owns the job or throw ForbiddenException.
     */
    public void assertOwner(Job job, User currentUser) {
        if (!job.getOwner().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("You do not own this job");
        }
    }

    public JobResponse toResponse(Job job) {
        List<SkillResponse> skills = job.getSkills().stream()
                .map(s -> new SkillResponse(s.getId(), s.getName(), s.getWeight()))
                .collect(Collectors.toList());
        return new JobResponse(
                job.getId(),
                job.getTitle(),
                job.getDescription(),
                job.getOwner().getId(),
                skills,
                job.getCreatedAt(),
                job.getUpdatedAt());
    }
}
