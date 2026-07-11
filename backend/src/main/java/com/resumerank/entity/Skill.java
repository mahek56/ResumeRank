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
import jakarta.persistence.UniqueConstraint;
import java.util.UUID;

/**
 * Maps to the 'skills' table (V2 migration).
 * A skill belongs to a job with a configurable weight for scoring.
 * UNIQUE constraint on (job_id, name).
 */
@Entity
@Table(name = "skills", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"job_id", "name"})
})
public class Skill {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "weight", nullable = false)
    private float weight = 1.0f;

    protected Skill() {}

    public Skill(Job job, String name, float weight) {
        this.job = job;
        this.name = name;
        this.weight = weight;
    }

    // --- Getters ---

    public UUID getId() { return id; }
    public Job getJob() { return job; }
    public String getName() { return name; }
    public float getWeight() { return weight; }

    // --- Setters ---

    public void setJob(Job job) { this.job = job; }
    public void setName(String name) { this.name = name; }
    public void setWeight(float weight) { this.weight = weight; }
}
