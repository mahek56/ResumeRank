package com.resumerank.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Maps to the 'scores' table (V4 migration).
 * Composite score = 60% semantic + 40% keyword.
 * One score per candidate (UNIQUE on candidate_id).
 */
@Entity
@Table(name = "scores")
public class Score {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "candidate_id", nullable = false, unique = true)
    private Candidate candidate;

    @Column(name = "composite_score", nullable = false)
    private float compositeScore;

    @Column(name = "semantic_score", nullable = false)
    private float semanticScore;

    @Column(name = "keyword_score", nullable = false)
    private float keywordScore;

    @Column(name = "scoring_method", nullable = false, length = 50)
    private String scoringMethod = "sentence-transformers";

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "matched_skills", nullable = false, columnDefinition = "JSONB")
    private List<String> matchedSkills = List.of();

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "missing_skills", nullable = false, columnDefinition = "JSONB")
    private List<String> missingSkills = List.of();

    @Column(name = "computed_at", nullable = false)
    private OffsetDateTime computedAt;

    protected Score() {}

    public Score(Candidate candidate, float compositeScore, float semanticScore,
                 float keywordScore, String scoringMethod,
                 List<String> matchedSkills, List<String> missingSkills) {
        this.candidate = candidate;
        this.compositeScore = compositeScore;
        this.semanticScore = semanticScore;
        this.keywordScore = keywordScore;
        this.scoringMethod = scoringMethod;
        this.matchedSkills = matchedSkills;
        this.missingSkills = missingSkills;
        this.computedAt = OffsetDateTime.now();
    }

    // --- Getters ---

    public UUID getId() { return id; }
    public Candidate getCandidate() { return candidate; }
    public float getCompositeScore() { return compositeScore; }
    public float getSemanticScore() { return semanticScore; }
    public float getKeywordScore() { return keywordScore; }
    public String getScoringMethod() { return scoringMethod; }
    public List<String> getMatchedSkills() { return matchedSkills; }
    public List<String> getMissingSkills() { return missingSkills; }
    public OffsetDateTime getComputedAt() { return computedAt; }
}
