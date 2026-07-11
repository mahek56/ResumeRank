package com.resumerank.repository;

import com.resumerank.entity.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface JobRepository extends JpaRepository<Job, UUID> {

    /**
     * Fetch all jobs owned by a specific user, paginated.
     */
    Page<Job> findByOwnerId(UUID ownerId, Pageable pageable);
}
