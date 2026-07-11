package com.resumerank.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

/**
 * Request body for uploading a candidate (multipart — file is separate).
 */
public class CandidateUploadRequest {

    @NotNull(message = "jobId is required")
    private UUID jobId;

    @NotBlank(message = "name is required")
    @Size(max = 255, message = "name must be ≤ 255 characters")
    private String name;

    @Size(max = 255, message = "email must be ≤ 255 characters")
    private String email;

    public CandidateUploadRequest() {}

    public UUID getJobId() { return jobId; }
    public void setJobId(UUID jobId) { this.jobId = jobId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
