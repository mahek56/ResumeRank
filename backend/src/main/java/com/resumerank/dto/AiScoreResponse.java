package com.resumerank.dto;

import java.util.List;

/**
 * Response from FastAPI POST /score.
 */
public class AiScoreResponse {

    private float compositeScore;
    private float semanticScore;
    private float keywordScore;
    private List<String> matchedSkills;
    private List<String> missingSkills;
    private String scoringMethod;

    public AiScoreResponse() {}

    public float getCompositeScore() { return compositeScore; }
    public void setCompositeScore(float compositeScore) { this.compositeScore = compositeScore; }

    public float getSemanticScore() { return semanticScore; }
    public void setSemanticScore(float semanticScore) { this.semanticScore = semanticScore; }

    public float getKeywordScore() { return keywordScore; }
    public void setKeywordScore(float keywordScore) { this.keywordScore = keywordScore; }

    public List<String> getMatchedSkills() { return matchedSkills; }
    public void setMatchedSkills(List<String> matchedSkills) { this.matchedSkills = matchedSkills; }

    public List<String> getMissingSkills() { return missingSkills; }
    public void setMissingSkills(List<String> missingSkills) { this.missingSkills = missingSkills; }

    public String getScoringMethod() { return scoringMethod; }
    public void setScoringMethod(String scoringMethod) { this.scoringMethod = scoringMethod; }
}
