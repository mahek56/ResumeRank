package com.resumerank.repository;

import com.resumerank.entity.Candidate;
import com.resumerank.entity.CandidateStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, UUID> {

    /**
     * Paginated candidate list for a job, with optional search and status filter.
     * Search applies ILIKE on name and email (null = no search filter).
     * Status null = all statuses.
     *
     * Joined to scores for composite_score-based sorting — scores.candidate_id
     * may be null (LEFT JOIN) if scoring hasn't completed.
     */
    @Query(value = """
        SELECT c FROM Candidate c
        LEFT JOIN c.score s
        WHERE c.job.id = :jobId
          AND (:hasSearch = false
               OR LOWER(c.name)  LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%')))
          AND (:hasStatus = false OR CAST(c.status AS string) = CAST(:status AS string))
        """,
        countQuery = """
        SELECT count(c) FROM Candidate c
        WHERE c.job.id = :jobId
          AND (:hasSearch = false
               OR LOWER(c.name)  LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%')))
          AND (:hasStatus = false OR CAST(c.status AS string) = CAST(:status AS string))
        """)
    Page<Candidate> findByJobIdFiltered(
            @Param("jobId") UUID jobId,
            @Param("hasSearch") boolean hasSearch,
            @Param("search") String search,
            @Param("hasStatus") boolean hasStatus,
            @Param("status") CandidateStatus status,
            Pageable pageable);

    /**
     * All candidates for a job (used by CSV export — no pagination).
     */
    @Query("""
        SELECT c FROM Candidate c
        LEFT JOIN c.score s
        WHERE c.job.id = :jobId
          AND (:status IS NULL OR CAST(c.status AS string) = CAST(:status AS string))
        ORDER BY s.compositeScore DESC NULLS LAST
        """)
    List<Candidate> findByJobIdForExport(
            @Param("jobId") UUID jobId,
            @Param("status") CandidateStatus status);

    /**
     * Load a candidate with its job eagerly (avoids N+1 in owner-check).
     */
    @Query("SELECT c FROM Candidate c JOIN FETCH c.job j JOIN FETCH j.owner WHERE c.id = :id")
    Optional<Candidate> findByIdWithJob(@Param("id") UUID id);

    /**
     * Bulk load by IDs (for bulk-status update validation).
     */
    @Query("SELECT c FROM Candidate c JOIN FETCH c.job j JOIN FETCH j.owner WHERE c.id IN :ids")
    List<Candidate> findAllByIdWithJob(@Param("ids") List<UUID> ids);
}
