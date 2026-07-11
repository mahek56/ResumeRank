package com.resumerank.dto;

import java.util.UUID;

/**
 * DTO for skill create/update requests.
 */
public class SkillRequest {

    private String name;
    private float weight = 1.0f;

    public SkillRequest() {}

    public SkillRequest(String name, float weight) {
        this.name = name;
        this.weight = weight;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public float getWeight() { return weight; }
    public void setWeight(float weight) { this.weight = weight; }
}
