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

    public HealthController(DataSource dataSource, com.resumerank.repository.UserRepository userRepository) {
        this.dataSource = dataSource;
        this.userRepository = userRepository;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute("SELECT 1");
            long userCount = userRepository.count();
            return ResponseEntity.ok(Map.of(
                    "status", "UP", 
                    "database", "CONNECTED",
                    "userTable", "EXISTS",
                    "usersCount", userCount
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "status", "DOWN",
                    "error", e.getMessage() != null ? e.getMessage() : e.getClass().getName()
            ));
        }
    }
}
