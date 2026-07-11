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
import java.util.UUID;

/**
 * Maps to the 'interview_summaries' table (V6 migration).
 * Bonus feature — LLM-generated interview summaries.
 * Created now for schema completeness; app works without this populated.
 */
@Entity
@Table(name = "interview_summaries")
public class InterviewSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "candidate_id", nullable = false, unique = true)
    private Candidate candidate;

    @Column(name = "strengths", columnDefinition = "TEXT")
    private String strengths;

    @Column(name = "weaknesses", columnDefinition = "TEXT")
    private String weaknesses;

    @Column(name = "recommendation", columnDefinition = "TEXT")
    private String recommendation;

    @Column(name = "generated_at", nullable = false)
    private OffsetDateTime generatedAt;

    protected InterviewSummary() {}

    public InterviewSummary(Candidate candidate, String strengths,
                            String weaknesses, String recommendation) {
        this.candidate = candidate;
        this.strengths = strengths;
        this.weaknesses = weaknesses;
        this.recommendation = recommendation;
        this.generatedAt = OffsetDateTime.now();
    }

    // --- Getters ---

    public UUID getId() { return id; }
    public Candidate getCandidate() { return candidate; }
    public String getStrengths() { return strengths; }
    public String getWeaknesses() { return weaknesses; }
    public String getRecommendation() { return recommendation; }
    public OffsetDateTime getGeneratedAt() { return generatedAt; }

    // --- Setters ---

    public void setStrengths(String strengths) { this.strengths = strengths; }
    public void setWeaknesses(String weaknesses) { this.weaknesses = weaknesses; }
    public void setRecommendation(String recommendation) { this.recommendation = recommendation; }
}
