package com.resumerank.dashboard;

import java.util.List;
import java.util.Map;

/**
 * Response DTO for GET /api/jobs/{id}/dashboard.
 *
 * All aggregations are computed server-side so the frontend just renders
 * them — no further processing required.
 */
public class DashboardResponse {

    private long totalCandidates;
    private double avgScore;

    /** Histogram: count of candidates in each 20-point score band. */
    private ScoreDistribution scoreDistribution;

    /** Min, max, median composite scores across all scored candidates. */
    private ScoreRange scoreRange;

    /** How many candidates are in each status bucket. */
    private StatusFunnel statusFunnel;

    /** Top 10 skills most frequently missing from candidates, by frequency. */
    private List<MissingSkillEntry> topMissingSkills;

    public DashboardResponse() {}

    // --- Getters & Setters ---

    public long getTotalCandidates() { return totalCandidates; }
    public void setTotalCandidates(long totalCandidates) { this.totalCandidates = totalCandidates; }

    public double getAvgScore() { return avgScore; }
    public void setAvgScore(double avgScore) { this.avgScore = avgScore; }

    public ScoreDistribution getScoreDistribution() { return scoreDistribution; }
    public void setScoreDistribution(ScoreDistribution scoreDistribution) { this.scoreDistribution = scoreDistribution; }

    public ScoreRange getScoreRange() { return scoreRange; }
    public void setScoreRange(ScoreRange scoreRange) { this.scoreRange = scoreRange; }

    public StatusFunnel getStatusFunnel() { return statusFunnel; }
    public void setStatusFunnel(StatusFunnel statusFunnel) { this.statusFunnel = statusFunnel; }

    public List<MissingSkillEntry> getTopMissingSkills() { return topMissingSkills; }
    public void setTopMissingSkills(List<MissingSkillEntry> topMissingSkills) { this.topMissingSkills = topMissingSkills; }

    // --- Nested types ---

    public static class ScoreDistribution {
        /** 0–20 */
        private long band0to20;
        /** 20–40 */
        private long band20to40;
        /** 40–60 */
        private long band40to60;
        /** 60–80 */
        private long band60to80;
        /** 80–100 */
        private long band80to100;

        public ScoreDistribution() {}

        public ScoreDistribution(long b0, long b20, long b40, long b60, long b80) {
            this.band0to20  = b0;
            this.band20to40 = b20;
            this.band40to60 = b40;
            this.band60to80 = b60;
            this.band80to100 = b80;
        }

        public long getBand0to20()   { return band0to20; }
        public long getBand20to40()  { return band20to40; }
        public long getBand40to60()  { return band40to60; }
        public long getBand60to80()  { return band60to80; }
        public long getBand80to100() { return band80to100; }
    }

    public static class ScoreRange {
        private double min;
        private double max;
        private double median;

        public ScoreRange() {}

        public ScoreRange(double min, double max, double median) {
            this.min    = min;
            this.max    = max;
            this.median = median;
        }

        public double getMin()    { return min; }
        public double getMax()    { return max; }
        public double getMedian() { return median; }
    }

    public static class StatusFunnel {
        private long pending;
        private long shortlisted;
        private long rejected;

        public StatusFunnel() {}

        public StatusFunnel(long pending, long shortlisted, long rejected) {
            this.pending     = pending;
            this.shortlisted = shortlisted;
            this.rejected    = rejected;
        }

        public long getPending()     { return pending; }
        public long getShortlisted() { return shortlisted; }
        public long getRejected()    { return rejected; }
    }

    public static class MissingSkillEntry {
        private String skill;
        private long   count;

        public MissingSkillEntry() {}

        public MissingSkillEntry(String skill, long count) {
            this.skill = skill;
            this.count = count;
        }

        public String getSkill() { return skill; }
        public long   getCount() { return count; }
    }
}
