package com.resumerank.dto;

import java.util.List;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

/**
 * Response from FastAPI POST /parse-resume.
 */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class ParseResponse {

    private String rawText;
    private List<String> skills;
    private Integer experienceYears;
    private String education;
    private String email;

    public ParseResponse() {}

    public String getRawText() { return rawText; }
    public void setRawText(String rawText) { this.rawText = rawText; }

    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) { this.skills = skills; }

    public Integer getExperienceYears() { return experienceYears; }
    public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }

    public String getEducation() { return education; }
    public void setEducation(String education) { this.education = education; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
