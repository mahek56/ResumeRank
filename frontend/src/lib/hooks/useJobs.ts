"use client";

import { useState, useEffect, useCallback } from "react";
import { api, ApiClientError } from "../api";
import type { Job, JobRequest, PageResponse } from "../types";

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetch = useCallback(async (p = 0) => {
    setLoading(true);
    setError(null);
    try {
      const res: PageResponse<Job> = await api.jobs.list(p, 25);
      setJobs(res.content);
      setTotalPages(res.totalPages);
      setPage(p);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch(0);
  }, [fetch]);

  const create = useCallback(
    async (body: JobRequest): Promise<Job> => {
      const job = await api.jobs.create(body);
      // Optimistic: prepend to list
      setJobs((prev) => [job, ...prev]);
      return job;
    },
    []
  );

  const update = useCallback(
    async (id: string, body: JobRequest): Promise<Job> => {
      const updated = await api.jobs.update(id, body);
      setJobs((prev) => prev.map((j) => (j.id === id ? updated : j)));
      return updated;
    },
    []
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      // Optimistic remove
      setJobs((prev) => prev.filter((j) => j.id !== id));
      try {
        await api.jobs.delete(id);
      } catch (err) {
        // Roll back on failure
        fetch(page);
        throw err;
      }
    },
    [fetch, page]
  );

  return {
    jobs,
    loading,
    error,
    page,
    totalPages,
    refetch: fetch,
    create,
    update,
    remove,
  };
}
