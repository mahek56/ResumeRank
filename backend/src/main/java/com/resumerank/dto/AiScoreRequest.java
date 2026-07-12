package com.resumerank.dto;

import java.util.List;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

/**
 * Request body for FastAPI POST /score.
 */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class AiScoreRequest {

    private String jobDescription;
    private List<SkillWeight> jobSkills;
    private String resumeText;
    private List<String> candidateSkills;

    public AiScoreRequest() {}

    public AiScoreRequest(String jobDescription, List<SkillWeight> jobSkills,
                          String resumeText, List<String> candidateSkills) {
        this.jobDescription = jobDescription;
        this.jobSkills = jobSkills;
        this.resumeText = resumeText;
        this.candidateSkills = candidateSkills;
    }

    public String getJobDescription() { return jobDescription; }
    public void setJobDescription(String jobDescription) { this.jobDescription = jobDescription; }

    public List<SkillWeight> getJobSkills() { return jobSkills; }
    public void setJobSkills(List<SkillWeight> jobSkills) { this.jobSkills = jobSkills; }

    public String getResumeText() { return resumeText; }
    public void setResumeText(String resumeText) { this.resumeText = resumeText; }

    public List<String> getCandidateSkills() { return candidateSkills; }
    public void setCandidateSkills(List<String> candidateSkills) { this.candidateSkills = candidateSkills; }

    // --- Nested DTO ---

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public static class SkillWeight {
        private String name;
        private float weight;

        public SkillWeight() {}

        public SkillWeight(String name, float weight) {
            this.name = name;
            this.weight = weight;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public float getWeight() { return weight; }
        public void setWeight(float weight) { this.weight = weight; }
    }
}
