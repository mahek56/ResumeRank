"use client";

import { useState, useEffect, useCallback } from "react";
import { api, ApiClientError } from "../api";
import type { DashboardData } from "../types";

export function useDashboard(jobId: string) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.dashboard.get(jobId);
      setData(res);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
