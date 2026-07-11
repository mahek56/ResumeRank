package com.resumerank.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO for a candidate — includes score inline.
 * Returned on upload, list, and status-change endpoints.
 */
public class CandidateResponse {

    private UUID id;
    private UUID jobId;
    private String name;
    private String email;
    private String resumeFileUrl;
    private Integer experienceYears;
    private String education;
    private String status;
    private OffsetDateTime createdAt;

    // Score fields — null if scoring hasn't completed yet
    private Float compositeScore;
    private Float semanticScore;
    private Float keywordScore;
    private String scoringMethod;
    private List<String> matchedSkills;
    private List<String> missingSkills;

    public CandidateResponse() {}

    // --- Getters & setters ---

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getJobId() { return jobId; }
    public void setJobId(UUID jobId) { this.jobId = jobId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getResumeFileUrl() { return resumeFileUrl; }
    public void setResumeFileUrl(String resumeFileUrl) { this.resumeFileUrl = resumeFileUrl; }

    public Integer getExperienceYears() { return experienceYears; }
    public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }

    public String getEducation() { return education; }
    public void setEducation(String education) { this.education = education; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public Float getCompositeScore() { return compositeScore; }
    public void setCompositeScore(Float compositeScore) { this.compositeScore = compositeScore; }

    public Float getSemanticScore() { return semanticScore; }
    public void setSemanticScore(Float semanticScore) { this.semanticScore = semanticScore; }

    public Float getKeywordScore() { return keywordScore; }
    public void setKeywordScore(Float keywordScore) { this.keywordScore = keywordScore; }

    public String getScoringMethod() { return scoringMethod; }
    public void setScoringMethod(String scoringMethod) { this.scoringMethod = scoringMethod; }

    public List<String> getMatchedSkills() { return matchedSkills; }
    public void setMatchedSkills(List<String> matchedSkills) { this.matchedSkills = matchedSkills; }

    public List<String> getMissingSkills() { return missingSkills; }
    public void setMissingSkills(List<String> missingSkills) { this.missingSkills = missingSkills; }
}
