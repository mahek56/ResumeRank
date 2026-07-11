"use client";

import { useState } from "react";
import { useJobs } from "@/lib/hooks/useJobs";
import { useDashboard } from "@/lib/hooks/useDashboard";
import { Card } from "@/components/ui/Card";
import { Skeleton, StatCardSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { clsx } from "clsx";

// ---- Stat card ----
function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card padding="md" className="flex flex-col gap-1">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">{label}</p>
      <p className="text-2xl font-bold text-[var(--color-text-primary)]">{value}</p>
      {sub && <p className="text-xs text-[var(--color-text-secondary)]">{sub}</p>}
    </Card>
  );
}

// ---- Score band bar (no recharts — pure CSS) ----
const BANDS = [
  { key: "band0to20",   label: "0–20",   color: "bg-[var(--color-error)]" },
  { key: "band20to40",  label: "20–40",  color: "bg-orange-500" },
  { key: "band40to60",  label: "40–60",  color: "bg-[var(--color-warning)]" },
  { key: "band60to80",  label: "60–80",  color: "bg-lime-500" },
  { key: "band80to100", label: "80–100", color: "bg-[var(--color-success)]" },
] as const;

function ScoreDistribution({ dist, total }: {
  dist: Record<string, number>;
  total: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      {BANDS.map((b) => {
        const count = dist[b.key] ?? 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={b.key} className="flex items-center gap-3">
            <span className="w-14 text-right text-xs text-[var(--color-text-tertiary)]">{b.label}</span>
            <div className="flex-1 h-5 bg-[var(--color-bg-hover)] rounded-[var(--radius-sm)] overflow-hidden">
              <div
                className={clsx("h-full rounded-[var(--radius-sm)] transition-all", b.color)}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-12 text-xs text-[var(--color-text-secondary)]">
              {count} <span className="text-[var(--color-text-tertiary)]">({pct}%)</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---- Dashboard for one job ----
function JobDashboard({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
  const { data, loading, error, refetch } = useDashboard(jobId);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton height="h-5" width="w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <StatCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Failed to load dashboard" message={error} onRetry={refetch} />;
  }

  if (!data) return null;

  const { totalCandidates, avgScore, scoreRange, statusFunnel, scoreDistribution, topMissingSkills } = data;

  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)]">{jobTitle}</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total candidates" value={totalCandidates} />
        <StatCard label="Avg score" value={avgScore > 0 ? avgScore.toFixed(1) : "—"} />
        <StatCard
          label="Score range"
          value={scoreRange.min > 0 ? `${scoreRange.min.toFixed(0)}–${scoreRange.max.toFixed(0)}` : "—"}
          sub={scoreRange.median > 0 ? `median ${scoreRange.median.toFixed(1)}` : undefined}
        />
        <StatCard
          label="Shortlisted"
          value={statusFunnel.shortlisted}
          sub={`${statusFunnel.pending} pending · ${statusFunnel.rejected} rejected`}
        />
      </div>

      {/* Score distribution */}
      {totalCandidates > 0 && (
        <Card padding="md" className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
            Score distribution
          </p>
          <ScoreDistribution
            dist={scoreDistribution as unknown as Record<string, number>}
            total={totalCandidates}
          />
        </Card>
      )}

      {/* Top missing skills */}
      {topMissingSkills.length > 0 && (
        <Card padding="md" className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
            Top missing skills
          </p>
          <div className="flex flex-wrap gap-2">
            {topMissingSkills.map((s) => (
              <span
                key={s.skill}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-pill)] text-xs font-medium bg-[var(--color-error-muted)] text-[var(--color-error)] border border-[var(--color-error)]/20"
              >
                {s.skill}
                <span className="opacity-60">×{s.count}</span>
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ---- Page ----
export default function DashboardPage() {
  const { jobs, loading, error } = useJobs();
  const [selectedJobId, setSelectedJobId] = useState<string>("");

  // Auto-select first job once loaded
  const activeId = selectedJobId || jobs[0]?.id || "";
  const activeJob = jobs.find((j) => j.id === activeId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Dashboard</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            Score analytics per job posting
          </p>
        </div>

        {/* Job selector */}
        {!loading && jobs.length > 1 && (
          <select
            value={activeId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            aria-label="Select job"
            className={clsx(
              "text-sm rounded-[var(--radius-default)] px-3 py-1.5",
              "bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]",
              "border border-[var(--color-border)] outline-none cursor-pointer",
              "focus:border-[var(--color-border-focus)] transition-colors"
            )}
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        )}
      </div>

      {/* Error loading jobs */}
      {error && <ErrorState title="Failed to load jobs" message={error} />}

      {/* Loading jobs */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <StatCardSkeleton key={i} />)}
        </div>
      )}

      {/* No jobs */}
      {!loading && !error && jobs.length === 0 && (
        <p className="text-sm text-[var(--color-text-secondary)] py-8 text-center">
          No jobs yet — create one on the Jobs page to see analytics here.
        </p>
      )}

      {/* Dashboard for selected job */}
      {!loading && activeJob && (
        <JobDashboard jobId={activeJob.id} jobTitle={activeJob.title} />
      )}
    </div>
  );
}
