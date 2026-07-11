package com.resumerank.repository;

import com.resumerank.entity.Candidate;
import com.resumerank.entity.CandidateSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CandidateSkillRepository extends JpaRepository<CandidateSkill, UUID> {

    List<CandidateSkill> findByCandidate(Candidate candidate);
}
