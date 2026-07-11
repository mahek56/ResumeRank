package com.resumerank.dto;

import java.util.UUID;

/**
 * DTO for skill responses.
 */
public class SkillResponse {

    private UUID id;
    private String name;
    private float weight;

    public SkillResponse() {}

    public SkillResponse(UUID id, String name, float weight) {
        this.id = id;
        this.name = name;
        this.weight = weight;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public float getWeight() { return weight; }
    public void setWeight(float weight) { this.weight = weight; }
}
