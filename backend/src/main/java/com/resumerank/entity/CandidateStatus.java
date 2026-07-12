package com.resumerank.entity;

/**
 * Maps to PostgreSQL enum type 'candidate_status' created in V3 migration.
 */
public enum CandidateStatus {
    pending,
    shortlisted,
    rejected;

    /**
     * Converts to the lowercase value stored in PostgreSQL.
     */
    public String toDbValue() {
        return name().toLowerCase();
    }

    /**
     * Parses from the lowercase PostgreSQL value.
     */
    public static CandidateStatus fromDbValue(String value) {
        return valueOf(value.toLowerCase());
    }
}
