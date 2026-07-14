"use client";

import { useState, useRef, use } from "react";
import Link from "next/link";
import {
  Upload,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Users,
} from "lucide-react";
import { clsx } from "clsx";
import { useCandidates } from "@/lib/hooks/useCandidates";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { CandidateRowSkeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api";
import type { Candidate, CandidateStatus, SortField, SortDir } from "@/lib/types";

// ---- Score bar ----

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-[var(--color-text-tertiary)]">—</span>;
  const pct = Math.round(score);
  const color =
    pct >= 80
      ? "bg-[var(--color-success)]"
      : pct >= 50
      ? "bg-[var(--color-warning)]"
      : "bg-[var(--color-error)]";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
        <div className={clsx("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-[var(--color-text-primary)] w-8">{pct}</span>
    </div>
  );
}

// ---- Status selector ----

const STATUS_OPTIONS: CandidateStatus[] = ["pending", "shortlisted", "rejected"];

function StatusSelect({
  value,
  onChange,
}: {
  value: CandidateStatus;
  onChange: (s: CandidateStatus) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as CandidateStatus)}
      aria-label="Candidate status"
      className={clsx(
        "text-xs rounded-[var(--radius-pill)] px-2 py-0.5 font-medium border",
        "bg-transparent cursor-pointer outline-none",
        "transition-colors duration-[var(--duration-micro)]",
        value === "shortlisted"
          ? "text-[var(--color-success)] border-[var(--color-success)]/30 bg-[var(--color-success-muted)]"
          : value === "rejected"
          ? "text-[var(--color-error)] border-[var(--color-error)]/30 bg-[var(--color-error-muted)]"
          : "text-[var(--color-warning)] border-[var(--color-warning)]/30 bg-[var(--color-warning-muted)]"
      )}
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s} className="bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]">
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </option>
      ))}
    </select>
  );
}

// ---- Sort header cell ----

function SortTh({
  label,
  field,
  current,
  dir,
  onSort,
}: {
  label: string;
  field: SortField;
  current: SortField | undefined;
  dir: SortDir | undefined;
  onSort: (f: SortField, d: SortDir) => void;
}) {
  const isActive = current === field;
  const nextDir: SortDir = isActive && dir === "desc" ? "asc" : "desc";
  return (
    <th scope="col">
      <button
        onClick={() => onSort(field, nextDir)}
        className={clsx(
          "flex items-center gap-1 text-xs font-medium uppercase tracking-wide",
          "transition-colors duration-[var(--duration-micro)]",
          isActive
            ? "text-[var(--color-accent-400)]"
            : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
        )}
      >
        {label}
        {isActive ? (
          dir === "desc" ? <ChevronDown size={12} /> : <ChevronUp size={12} />
        ) : (
          <ChevronsUpDown size={12} />
        )}
      </button>
    </th>
  );
}

// ---- Upload Modal ----

function UploadModal({
  open,
  onClose,
  jobId,
  onUploaded,
}: {
  open: boolean;
  onClose: () => void;
  jobId: string;
  onUploaded: () => void;
}) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, errors: 0 });

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []).filter((f) =>
      f.type === "application/pdf"
    );
    setFiles(picked);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === "application/pdf"
    );
    setFiles(dropped);
  };

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    setProgress({ done: 0, total: files.length, errors: 0 });

    let errors = 0;
    for (let i = 0; i < files.length; i++) {
      const fd = new FormData();
      fd.append("file", files[i]);
      fd.append("jobId", jobId);
      fd.append("name", files[i].name.replace(/\.[^/.]+$/, ""));
      try {
        await api.candidates.upload(fd);
      } catch {
        errors++;
      }
      setProgress({ done: i + 1, total: files.length, errors });
    }

    setUploading(false);
    const succeeded = files.length - errors;
    if (succeeded > 0) toast(`${succeeded} resume${succeeded > 1 ? "s" : ""} uploaded & ranked!`, "success");
    if (errors > 0) toast(`${errors} upload${errors > 1 ? "s" : ""} failed.`, "error");
    setFiles([]);
    onUploaded();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Upload Resumes" size="md">
      <div className="flex flex-col gap-4">
        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className={clsx(
            "border-2 border-dashed rounded-[var(--radius-lg)] p-8",
            "flex flex-col items-center gap-3 cursor-pointer",
            "transition-colors duration-[var(--duration-micro)]",
            "border-[var(--color-border)] hover:border-[var(--color-border-focus)]",
            "hover:bg-[var(--color-bg-hover)]"
          )}
        >
          <Upload size={28} className="text-[var(--color-text-tertiary)]" />
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              Drop PDF resumes here
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
              or click to browse — PDF only
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            onChange={handleFiles}
            className="sr-only"
          />
        </div>

        {/* Selected files */}
        {files.length > 0 && (
          <div className="text-sm text-[var(--color-text-secondary)]">
            <p className="font-medium mb-1">{files.length} file{files.length > 1 ? "s" : ""} selected:</p>
            <ul className="space-y-0.5 max-h-28 overflow-y-auto">
              {files.map((f, i) => (
                <li key={i} className="text-xs text-[var(--color-text-tertiary)] truncate">
                  {f.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Upload progress */}
        {uploading && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-[var(--color-text-secondary)]">
              <span>Uploading & scoring…</span>
              <span>{progress.done}/{progress.total}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
              <div
                className="h-full bg-[var(--color-accent-500)] rounded-full transition-all"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
          <Button variant="ghost" size="md" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleUpload}
            loading={uploading}
            disabled={!files.length}
          >
            <Upload size={14} />
            Upload {files.length > 0 ? `${files.length} resume${files.length > 1 ? "s" : ""}` : ""}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---- Candidate Detail Modal ----

function CandidateDetailModal({
  candidate,
  open,
  onClose,
}: {
  candidate: Candidate | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!candidate) return null;

  return (
    <Modal open={open} onClose={onClose} title="Candidate Details" size="md">
      <div className="flex flex-col gap-4 text-sm text-[var(--color-text-secondary)]">
        <div>
          <h3 className="font-semibold text-[var(--color-text-primary)] text-base">{candidate.name}</h3>
          <p>{candidate.email || "No email provided"}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-1">
          <div className="bg-[var(--color-bg-elevated)] p-3 rounded-[var(--radius-md)] border border-[var(--color-border)]">
            <div className="text-[10px] text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wider font-semibold">Composite Score</div>
            <div className="text-2xl font-mono text-[var(--color-text-primary)]">
              {candidate.compositeScore !== null ? Math.round(candidate.compositeScore) : "—"}
            </div>
          </div>
          <div className="bg-[var(--color-bg-elevated)] p-3 rounded-[var(--radius-md)] border border-[var(--color-border)]">
            <div className="text-[10px] text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wider font-semibold">Scoring Method</div>
            <div className="text-sm font-medium mt-2 text-[var(--color-text-primary)]">
              {candidate.scoringMethod === "tfidf" ? "TF-IDF" : candidate.scoringMethod === "sentence-transformers" ? "Semantic (BERT)" : (candidate.scoringMethod || "—")}
            </div>
          </div>
          <div className="bg-[var(--color-bg-elevated)] p-3 rounded-[var(--radius-md)] border border-[var(--color-border)]">
            <div className="text-[10px] text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wider font-semibold">Semantic Score</div>
            <div className="text-lg font-mono text-[var(--color-text-primary)]">
              {candidate.semanticScore !== null ? Math.round(candidate.semanticScore) : "—"}
            </div>
          </div>
          <div className="bg-[var(--color-bg-elevated)] p-3 rounded-[var(--radius-md)] border border-[var(--color-border)]">
            <div className="text-[10px] text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wider font-semibold">Keyword Score</div>
            <div className="text-lg font-mono text-[var(--color-text-primary)]">
              {candidate.keywordScore !== null ? Math.round(candidate.keywordScore) : "—"}
            </div>
          </div>
        </div>

        <div className="mt-1">
          <div className="text-[10px] text-[var(--color-text-tertiary)] mb-2 uppercase tracking-wider font-semibold">Matched Skills</div>
          {candidate.matchedSkills && candidate.matchedSkills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {candidate.matchedSkills.map((sk) => (
                <Badge key={sk} variant="success" className="text-xs px-2 py-0.5">{sk}</Badge>
              ))}
            </div>
          ) : (
            <div className="text-xs text-[var(--color-text-tertiary)]">—</div>
          )}
        </div>

        <div className="mt-1">
          <div className="text-[10px] text-[var(--color-text-tertiary)] mb-2 uppercase tracking-wider font-semibold">Missing Skills</div>
          {candidate.missingSkills && candidate.missingSkills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {candidate.missingSkills.map((sk) => (
                <Badge key={sk} variant="error" className="text-xs px-2 py-0.5">{sk}</Badge>
              ))}
            </div>
          ) : (
            <div className="text-xs text-[var(--color-text-tertiary)]">None</div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end pt-4 mt-4 border-t border-[var(--color-border)]">
        <Button variant="ghost" size="md" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}

// ---- Job Detail Page ----

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: jobId } = use(params);
  const { toast } = useToast();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const {
    candidates,
    loading,
    error,
    totalElements,
    filters,
    setSort,
    updateStatus,
    refetch,
  } = useCandidates(jobId);

  const handleStatusChange = async (candidateId: string, status: CandidateStatus) => {
    try {
      await updateStatus(candidateId, status);
      toast(`Status updated to ${status}.`, "success");
    } catch {
      toast("Failed to update status.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Back nav + header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/jobs">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={14} /> Jobs
            </Button>
          </Link>
          <div className="h-4 w-px bg-[var(--color-border)]" />
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Candidates</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
              {loading ? "Loading…" : `${totalElements} candidate${totalElements !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <Button
          id="upload-btn"
          variant="primary"
          size="md"
          onClick={() => setUploadOpen(true)}
        >
          <Upload size={14} /> Upload resumes
        </Button>
      </div>

      {/* Error */}
      {error && (
        <ErrorState title="Failed to load candidates" message={error} onRetry={refetch} />
      )}

      {/* Table */}
      {!error && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
              <tr className="px-4">
                <th scope="col" className="text-left px-4 py-3">
                  <SortTh
                    label="Name"
                    field="name"
                    current={filters.sort}
                    dir={filters.dir}
                    onSort={setSort}
                  />
                </th>
                <th scope="col" className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">
                  Email
                </th>
                <th scope="col" className="text-left px-4 py-3">
                  <SortTh
                    label="Score"
                    field="composite_score"
                    current={filters.sort}
                    dir={filters.dir}
                    onSort={setSort}
                  />
                </th>
                <th scope="col" className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Loading rows */}
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="p-0">
                      <CandidateRowSkeleton />
                    </td>
                  </tr>
                ))}

              {/* Empty */}
              {!loading && candidates.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      icon={<Users size={28} />}
                      title="No candidates yet"
                      description="Upload PDF resumes to start ranking."
                      action={{ label: "Upload resumes", onClick: () => setUploadOpen(true) }}
                    />
                  </td>
                </tr>
              )}

              {/* Rows */}
              {!loading &&
                candidates.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCandidate(c)}
                    className="cursor-pointer border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-hover)] transition-colors"
                  >
                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--color-text-primary)]">{c.name}</div>
                      {c.matchedSkills && c.matchedSkills.length > 0 && (
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {c.matchedSkills.slice(0, 3).map((sk) => (
                            <Badge key={sk} variant="info" className="text-[10px]">{sk}</Badge>
                          ))}
                          {c.matchedSkills.length > 3 && (
                            <span className="text-[10px] text-[var(--color-text-tertiary)]">
                              +{c.matchedSkills.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {c.email ?? <span className="text-[var(--color-text-tertiary)]">—</span>}
                    </td>

                    {/* Score */}
                    <td className="px-4 py-3">
                      <ScoreBar score={c.compositeScore} />
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <StatusSelect
                        value={c.status}
                        onChange={(s) => handleStatusChange(c.id, s)}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        jobId={jobId}
        onUploaded={refetch}
      />
      
      <CandidateDetailModal
        candidate={selectedCandidate}
        open={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      />
    </div>
  );
}
