package com.resumerank.dashboard;

import com.resumerank.entity.CandidateStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.resumerank.entity.Score;

import java.util.List;
import java.util.UUID;

/**
 * Aggregate queries for the dashboard.
 * All queries scope to a single job to enforce tenant isolation.
 */
@Repository
public interface DashboardRepository extends JpaRepository<Score, UUID> {

    // -------------------------------------------------------------------------
    // Score stats
    // -------------------------------------------------------------------------

    /**
     * Average composite score for all scored candidates in a job.
     */
    @Query("""
        SELECT AVG(s.compositeScore)
        FROM Score s
        WHERE s.candidate.job.id = :jobId
        """)
    Double avgCompositeScore(@Param("jobId") UUID jobId);

    /**
     * Min composite score.
     */
    @Query("""
        SELECT MIN(s.compositeScore)
        FROM Score s
        WHERE s.candidate.job.id = :jobId
        """)
    Double minCompositeScore(@Param("jobId") UUID jobId);

    /**
     * Max composite score.
     */
    @Query("""
        SELECT MAX(s.compositeScore)
        FROM Score s
        WHERE s.candidate.job.id = :jobId
        """)
    Double maxCompositeScore(@Param("jobId") UUID jobId);

    /**
     * All composite scores for a job, sorted — used to compute median in Java.
     * (Postgres has PERCENTILE_CONT but JPQL doesn't; median from sorted list
     * is simpler and avoids a native query.)
     */
    @Query("""
        SELECT s.compositeScore
        FROM Score s
        WHERE s.candidate.job.id = :jobId
        ORDER BY s.compositeScore ASC
        """)
    List<Float> allCompositeScoresSorted(@Param("jobId") UUID jobId);

    // -------------------------------------------------------------------------
    // Score distribution (5 bands of 20 points each)
    // -------------------------------------------------------------------------

    /** Count of candidates whose composite score is in [lo, hi). */
    @Query("""
        SELECT COUNT(s)
        FROM Score s
        WHERE s.candidate.job.id = :jobId
          AND s.compositeScore >= :lo
          AND s.compositeScore < :hi
        """)
    long countInBand(@Param("jobId") UUID jobId,
                     @Param("lo") float lo,
                     @Param("hi") float hi);

    /**
     * Special case for top band: includes 100 (score = 100 is valid).
     */
    @Query("""
        SELECT COUNT(s)
        FROM Score s
        WHERE s.candidate.job.id = :jobId
          AND s.compositeScore >= 80
        """)
    long countInTopBand(@Param("jobId") UUID jobId);

    // -------------------------------------------------------------------------
    // Status funnel
    // -------------------------------------------------------------------------

    @Query("""
        SELECT COUNT(c)
        FROM Candidate c
        WHERE c.job.id = :jobId
          AND c.status = :status
        """)
    long countByStatus(@Param("jobId") UUID jobId,
                       @Param("status") CandidateStatus status);

    /**
     * Total candidates regardless of whether they have a score yet.
     */
    @Query("SELECT COUNT(c) FROM Candidate c WHERE c.job.id = :jobId")
    long countAllCandidates(@Param("jobId") UUID jobId);

    // -------------------------------------------------------------------------
    // Missing skills — raw JSONB returned as strings for Java-side aggregation
    // -------------------------------------------------------------------------

    @Query("""
        SELECT s.missingSkills
        FROM Score s
        WHERE s.candidate.job.id = :jobId
          AND s.missingSkills IS NOT NULL
        """)
    List<List<String>> allMissingSkills(@Param("jobId") UUID jobId);
}
