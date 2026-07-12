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

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute("SELECT 1");
            return ResponseEntity.ok(Map.of("status", "UP", "database", "CONNECTED"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "status", "DOWN",
                    "error", e.getMessage() != null ? e.getMessage() : e.getClass().getName()
            ));
        }
    }
}
