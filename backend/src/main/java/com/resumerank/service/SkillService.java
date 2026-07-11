package com.resumerank.service;

import com.resumerank.dto.SkillRequest;
import com.resumerank.dto.SkillResponse;
import com.resumerank.entity.Job;
import com.resumerank.entity.Skill;
import com.resumerank.entity.User;
import com.resumerank.exception.NotFoundException;
import com.resumerank.repository.SkillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Business logic for Skill CRUD.
 * All mutations verify the current user owns the parent job (row-level auth).
 */
@Service
public class SkillService {

    private final SkillRepository skillRepository;
    private final JobService jobService;
    private final AuditService auditService;

    public SkillService(SkillRepository skillRepository, JobService jobService, AuditService auditService) {
        this.skillRepository = skillRepository;
        this.jobService = jobService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<SkillResponse> findByJobId(UUID jobId, User currentUser) {
        Job job = jobService.getJobOrThrow(jobId);
        jobService.assertOwner(job, currentUser);

        return skillRepository.findByJobId(jobId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public SkillResponse create(UUID jobId, SkillRequest request, User currentUser) {
        Job job = jobService.getJobOrThrow(jobId);
        jobService.assertOwner(job, currentUser);

        Skill skill = new Skill(job, request.getName(), request.getWeight());
        skill = skillRepository.save(skill);

        // Touch job's updatedAt
        job.setUpdatedAt(OffsetDateTime.now());

        auditService.log("Skill", skill.getId(), "CREATED", currentUser,
                "{\"jobId\":\"" + jobId + "\",\"name\":\"" + request.getName() + "\"}");
        return toResponse(skill);
    }

    @Transactional
    public SkillResponse update(UUID jobId, UUID skillId, SkillRequest request, User currentUser) {
        Job job = jobService.getJobOrThrow(jobId);
        jobService.assertOwner(job, currentUser);

        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new NotFoundException("Skill", skillId));

        // Verify the skill actually belongs to this job
        if (!skill.getJob().getId().equals(jobId)) {
            throw new NotFoundException("Skill", skillId);
        }

        skill.setName(request.getName());
        skill.setWeight(request.getWeight());
        skill = skillRepository.save(skill);

        job.setUpdatedAt(OffsetDateTime.now());

        auditService.log("Skill", skillId, "UPDATED", currentUser, null);
        return toResponse(skill);
    }

    @Transactional
    public void delete(UUID jobId, UUID skillId, User currentUser) {
        Job job = jobService.getJobOrThrow(jobId);
        jobService.assertOwner(job, currentUser);

        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new NotFoundException("Skill", skillId));

        if (!skill.getJob().getId().equals(jobId)) {
            throw new NotFoundException("Skill", skillId);
        }

        skillRepository.delete(skill);
        job.setUpdatedAt(OffsetDateTime.now());

        auditService.log("Skill", skillId, "DELETED", currentUser, null);
    }

    /**
     * Bulk replace: delete all existing skills for the job and insert the new set.
     * Used by the frontend skill editor that sends the entire list at once.
     */
    @Transactional
    public List<SkillResponse> bulkReplace(UUID jobId, List<SkillRequest> requests, User currentUser) {
        Job job = jobService.getJobOrThrow(jobId);
        jobService.assertOwner(job, currentUser);

        // Clear existing skills via orphanRemoval
        job.clearSkills();
        skillRepository.flush(); // ensure deletes are executed before inserts

        // Add new skills
        for (SkillRequest req : requests) {
            Skill skill = new Skill(job, req.getName(), req.getWeight());
            job.addSkill(skill);
        }

        job.setUpdatedAt(OffsetDateTime.now());

        auditService.log("Skill", jobId, "BULK_REPLACED", currentUser,
                "{\"count\":" + requests.size() + "}");

        return job.getSkills().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private SkillResponse toResponse(Skill skill) {
        return new SkillResponse(skill.getId(), skill.getName(), skill.getWeight());
    }
}
