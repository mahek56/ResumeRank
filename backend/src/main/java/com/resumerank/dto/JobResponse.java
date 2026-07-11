package com.resumerank.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for job responses.
 */
public class JobResponse {

    private UUID id;
    private String title;
    private String description;
    private UUID ownerId;
    private List<SkillResponse> skills;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public JobResponse() {}

    public JobResponse(UUID id, String title, String description, UUID ownerId,
                       List<SkillResponse> skills, OffsetDateTime createdAt, OffsetDateTime updatedAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.ownerId = ownerId;
        this.skills = skills;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public UUID getOwnerId() { return ownerId; }
    public void setOwnerId(UUID ownerId) { this.ownerId = ownerId; }

    public List<SkillResponse> getSkills() { return skills; }
    public void setSkills(List<SkillResponse> skills) { this.skills = skills; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
