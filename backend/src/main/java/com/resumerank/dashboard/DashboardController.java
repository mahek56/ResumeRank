package com.resumerank.dashboard;

import com.resumerank.entity.User;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Dashboard endpoints.
 *
 * GET /api/jobs/{id}/dashboard — aggregated stats for one job.
 *   - Owner check enforced in DashboardService.
 *   - Returns: total, avgScore, scoreDistribution, scoreRange,
 *              statusFunnel, topMissingSkills.
 */
@RestController
@RequestMapping("/api/jobs")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/{id}/dashboard")
    public ResponseEntity<DashboardResponse> getDashboard(
            @PathVariable UUID id,
            @AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(dashboardService.getDashboard(id, actor));
    }
}
