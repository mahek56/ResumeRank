package com.resumerank.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;

/**
 * Maps to the 'candidate_skills' table (V4 migration).
 * Extracted skills per candidate, with a 'matched' flag indicating
 * if it matched a job skill.
 */
@Entity
@Table(name = "candidate_skills")
public class CandidateSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "matched", nullable = false)
    private boolean matched = false;

    protected CandidateSkill() {}

    public CandidateSkill(Candidate candidate, String name, boolean matched) {
        this.candidate = candidate;
        this.name = name;
        this.matched = matched;
    }

    // --- Getters ---

    public UUID getId() { return id; }
    public Candidate getCandidate() { return candidate; }
    public String getName() { return name; }
    public boolean isMatched() { return matched; }

    // --- Setters ---

    public void setMatched(boolean matched) { this.matched = matched; }
}
