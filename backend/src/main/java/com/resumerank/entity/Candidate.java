package com.resumerank.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Maps to the 'candidates' table (V3 migration).
 * A candidate belongs to a job. Status is a PG enum:
 * pending (default), shortlisted, rejected.
 * The tool never auto-rejects — recruiter sets status manually.
 */
@Entity
@Table(name = "candidates")
public class Candidate {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "resume_file_url", nullable = false, columnDefinition = "TEXT")
    private String resumeFileUrl;

    @Column(name = "raw_text", columnDefinition = "TEXT")
    private String rawText;

    @Column(name = "experience_years")
    private Integer experienceYears;

    @Column(name = "education", columnDefinition = "TEXT")
    private String education;

    @Enumerated(EnumType.STRING)
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    @Column(name = "status", nullable = false, columnDefinition = "candidate_status")
    private CandidateStatus status = CandidateStatus.pending;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @OneToOne(mappedBy = "candidate", fetch = FetchType.LAZY)
    private Score score;

    protected Candidate() {}

    public Candidate(Job job, String name, String resumeFileUrl) {
        this.job = job;
        this.name = name;
        this.resumeFileUrl = resumeFileUrl;
        this.status = CandidateStatus.pending;
        this.createdAt = OffsetDateTime.now();
    }

    // --- Getters ---

    public UUID getId() { return id; }
    public Job getJob() { return job; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getResumeFileUrl() { return resumeFileUrl; }
    public String getRawText() { return rawText; }
    public Integer getExperienceYears() { return experienceYears; }
    public String getEducation() { return education; }
    public CandidateStatus getStatus() { return status; }
    public OffsetDateTime getCreatedAt() { return createdAt; }

    // --- Setters ---

    public void setEmail(String email) { this.email = email; }
    public void setResumeFileUrl(String resumeFileUrl) { this.resumeFileUrl = resumeFileUrl; }
    public void setRawText(String rawText) { this.rawText = rawText; }
    public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }
    public void setEducation(String education) { this.education = education; }
    public void setStatus(CandidateStatus status) { this.status = status; }
}
