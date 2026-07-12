package com.resumerank.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.util.Map;

@RestController
public class HealthController {

    private final DataSource dataSource;
    private final com.resumerank.repository.UserRepository userRepository;
    private final com.resumerank.repository.JobRepository jobRepository;
    private final com.resumerank.repository.AuditLogRepository auditLogRepository;
    private final com.resumerank.repository.CandidateRepository candidateRepository;
    private final com.resumerank.repository.SkillRepository skillRepository;

    public HealthController(DataSource dataSource, 
                            com.resumerank.repository.UserRepository userRepository,
                            com.resumerank.repository.JobRepository jobRepository,
                            com.resumerank.repository.AuditLogRepository auditLogRepository,
                            com.resumerank.repository.CandidateRepository candidateRepository,
                            com.resumerank.repository.SkillRepository skillRepository) {
        this.dataSource = dataSource;
        this.userRepository = userRepository;
        this.jobRepository = jobRepository;
        this.auditLogRepository = auditLogRepository;
        this.candidateRepository = candidateRepository;
        this.skillRepository = skillRepository;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute("SELECT 1");
            return ResponseEntity.ok(Map.of(
                    "status", "UP", 
                    "database", "CONNECTED",
                    "users", userRepository.count(),
                    "jobs", jobRepository.count(),
                    "auditLogs", auditLogRepository.count(),
                    "candidates", candidateRepository.count(),
                    "skills", skillRepository.count()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "status", "DOWN",
                    "error", e.getMessage() != null ? e.getMessage() : e.getClass().getName()
            ));
        }
    }
}
