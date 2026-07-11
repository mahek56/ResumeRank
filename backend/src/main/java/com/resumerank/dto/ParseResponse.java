package com.resumerank.dto;

import java.util.List;

/**
 * Response from FastAPI POST /parse-resume.
 */
public class ParseResponse {

    private String rawText;
    private List<String> skills;
    private Integer experienceYears;
    private String education;

    public ParseResponse() {}

    public String getRawText() { return rawText; }
    public void setRawText(String rawText) { this.rawText = rawText; }

    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) { this.skills = skills; }

    public Integer getExperienceYears() { return experienceYears; }
    public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }

    public String getEducation() { return education; }
    public void setEducation(String education) { this.education = education; }
}
