"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api, ApiClientError } from "../api";
import type {
  Candidate,
  CandidateFilters,
  CandidateStatus,
  PageResponse,
} from "../types";

export function useCandidates(jobId: string, initialFilters?: Partial<CandidateFilters>) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [filters, setFilters] = useState<Partial<CandidateFilters>>({
    sort: "composite_score",
    dir: "desc",
    size: 25,
    ...initialFilters,
  });

  // Debounce ref for search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPage = useCallback(
    async (p: number, currentFilters: Partial<CandidateFilters>) => {
      if (!jobId) return;
      setLoading(true);
      setError(null);
      try {
        const res: PageResponse<Candidate> = await api.candidates.list({
          jobId,
          page: p,
          size: 25,
          ...currentFilters,
        });
        setCandidates(res.content);
        setPage(res.page);
        setTotalPages(res.totalPages);
        setTotalElements(res.totalElements);
      } catch (err) {
        setError(
          err instanceof ApiClientError ? err.message : "Failed to load candidates"
        );
      } finally {
        setLoading(false);
      }
    },
    [jobId]
  );

  // Initial load + filter changes
  useEffect(() => {
    fetchPage(0, filters);
  }, [fetchPage, filters]);

  // Debounced search update (300ms)
  const setSearch = useCallback(
    (search: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setFilters((f) => ({ ...f, search: search || undefined }));
      }, 300);
    },
    []
  );

  const setStatus = useCallback((status: CandidateStatus | undefined) => {
    setFilters((f) => ({ ...f, status }));
  }, []);

  const setSort = useCallback(
    (sort: CandidateFilters["sort"], dir: CandidateFilters["dir"]) => {
      setFilters((f) => ({ ...f, sort, dir }));
    },
    []
  );

  const goToPage = useCallback(
    (p: number) => {
      fetchPage(p, filters);
    },
    [fetchPage, filters]
  );

  // Optimistic status update
  const updateStatus = useCallback(
    async (id: string, status: CandidateStatus): Promise<void> => {
      // Optimistic
      setCandidates((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c))
      );
      try {
        await api.candidates.updateStatus(id, status);
      } catch (err) {
        // Roll back
        fetchPage(page, filters);
        throw err;
      }
    },
    [fetchPage, page, filters]
  );

  const bulkUpdateStatus = useCallback(
    async (ids: string[], status: CandidateStatus): Promise<void> => {
      const idSet = new Set(ids);
      // Optimistic
      setCandidates((prev) =>
        prev.map((c) => (idSet.has(c.id) ? { ...c, status } : c))
      );
      try {
        await api.candidates.bulkUpdateStatus(ids, status);
      } catch (err) {
        fetchPage(page, filters);
        throw err;
      }
    },
    [fetchPage, page, filters]
  );

  const refetch = useCallback(() => fetchPage(page, filters), [fetchPage, page, filters]);

  return {
    candidates,
    loading,
    error,
    page,
    totalPages,
    totalElements,
    filters,
    setSearch,
    setStatus,
    setSort,
    goToPage,
    updateStatus,
    bulkUpdateStatus,
    refetch,
  };
}
