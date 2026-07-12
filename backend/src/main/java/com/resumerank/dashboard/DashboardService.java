package com.resumerank.dashboard;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumerank.entity.CandidateStatus;
import com.resumerank.entity.Job;
import com.resumerank.entity.User;
import com.resumerank.exception.NotFoundException;
import com.resumerank.repository.JobRepository;
import com.resumerank.service.JobService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Computes dashboard aggregations for a single job.
 *
 * All operations are read-only and scoped to one job.
 * Caller must own the job (enforced via JobService.assertOwner).
 */
@Service
public class DashboardService {

    private static final Logger log = LoggerFactory.getLogger(DashboardService.class);
    private static final int TOP_MISSING_SKILLS_LIMIT = 10;

    private final DashboardRepository dashboardRepository;
    private final JobService jobService;
    private final ObjectMapper objectMapper;

    public DashboardService(DashboardRepository dashboardRepository,
                            JobService jobService,
                            ObjectMapper objectMapper) {
        this.dashboardRepository = dashboardRepository;
        this.jobService = jobService;
        this.objectMapper = objectMapper;
    }

    /**
     * Build the complete dashboard for a job.
     *
     * @param jobId  the job to aggregate
     * @param actor  the requesting user (must own the job)
     * @return fully populated DashboardResponse
     */
    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(UUID jobId, User actor) {
        // Owner check
        Job job = jobService.getJobOrThrow(jobId);
        jobService.assertOwner(job, actor);

        DashboardResponse response = new DashboardResponse();

        // -- Total candidates (including unscored) --
        long total = dashboardRepository.countAllCandidates(jobId);
        response.setTotalCandidates(total);

        // -- Average score --
        Double avg = dashboardRepository.avgCompositeScore(jobId);
        response.setAvgScore(avg != null ? round2(avg) : 0.0);

        // -- Score distribution --
        response.setScoreDistribution(buildDistribution(jobId));

        // -- Score range (min / max / median) --
        response.setScoreRange(buildScoreRange(jobId));

        // -- Status funnel --
        response.setStatusFunnel(buildStatusFunnel(jobId));

        // -- Top missing skills --
        response.setTopMissingSkills(buildTopMissingSkills(jobId));

        log.debug("Dashboard built for job {}: total={}, avg={}", jobId, total, response.getAvgScore());
        return response;
    }

    // -------------------------------------------------------------------------
    // Score distribution
    // -------------------------------------------------------------------------

    private DashboardResponse.ScoreDistribution buildDistribution(UUID jobId) {
        long b0   = dashboardRepository.countInBand(jobId, 0f, 20f);
        long b20  = dashboardRepository.countInBand(jobId, 20f, 40f);
        long b40  = dashboardRepository.countInBand(jobId, 40f, 60f);
        long b60  = dashboardRepository.countInBand(jobId, 60f, 80f);
        long b80  = dashboardRepository.countInTopBand(jobId);
        return new DashboardResponse.ScoreDistribution(b0, b20, b40, b60, b80);
    }

    // -------------------------------------------------------------------------
    // Score range
    // -------------------------------------------------------------------------

    private DashboardResponse.ScoreRange buildScoreRange(UUID jobId) {
        Double min = dashboardRepository.minCompositeScore(jobId);
        Double max = dashboardRepository.maxCompositeScore(jobId);

        if (min == null || max == null) {
            // No scored candidates yet
            return new DashboardResponse.ScoreRange(0, 0, 0);
        }

        List<Float> sorted = dashboardRepository.allCompositeScoresSorted(jobId);
        double median = computeMedian(sorted);

        return new DashboardResponse.ScoreRange(round2(min), round2(max), round2(median));
    }

    private double computeMedian(List<Float> sorted) {
        if (sorted == null || sorted.isEmpty()) return 0.0;
        int n = sorted.size();
        if (n % 2 == 1) {
            return sorted.get(n / 2);
        } else {
            return (sorted.get(n / 2 - 1) + sorted.get(n / 2)) / 2.0;
        }
    }

    // -------------------------------------------------------------------------
    // Status funnel
    // -------------------------------------------------------------------------

    private DashboardResponse.StatusFunnel buildStatusFunnel(UUID jobId) {
        long pending     = dashboardRepository.countByStatus(jobId, CandidateStatus.pending);
        long shortlisted = dashboardRepository.countByStatus(jobId, CandidateStatus.shortlisted);
        long rejected    = dashboardRepository.countByStatus(jobId, CandidateStatus.rejected);
        return new DashboardResponse.StatusFunnel(pending, shortlisted, rejected);
    }

    // -------------------------------------------------------------------------
    // Top missing skills — parse each JSON array, tally frequencies
    // -------------------------------------------------------------------------

    private List<DashboardResponse.MissingSkillEntry> buildTopMissingSkills(UUID jobId) {
        List<List<String>> skillLists = dashboardRepository.allMissingSkills(jobId);
        if (skillLists == null || skillLists.isEmpty()) {
            return List.of();
        }

        Map<String, Long> freq = new HashMap<>();
        for (List<String> skills : skillLists) {
            if (skills != null) {
                for (String skill : skills) {
                    if (skill != null && !skill.isBlank()) {
                        String key = skill.trim().toLowerCase();
                        freq.merge(key, 1L, Long::sum);
                    }
                }
            }
        }

        return freq.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(TOP_MISSING_SKILLS_LIMIT)
                .map(e -> new DashboardResponse.MissingSkillEntry(e.getKey(), e.getValue()))
                .collect(Collectors.toList());
    }

    // -------------------------------------------------------------------------
    // Utilities
    // -------------------------------------------------------------------------

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
