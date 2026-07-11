package com.resumerank.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * DTO for job create/update requests.
 */
public class JobRequest {

    private String title;
    private String description;

    public JobRequest() {}

    public JobRequest(String title, String description) {
        this.title = title;
        this.description = description;
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
