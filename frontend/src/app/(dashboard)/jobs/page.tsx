"use client";

import { useState, useId } from "react";
import Link from "next/link";
import { Plus, Briefcase, Trash2, X } from "lucide-react";
import { clsx } from "clsx";
import { useJobs } from "@/lib/hooks/useJobs";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import type { SkillRequest } from "@/lib/types";

// ---- Create Job Modal ----

interface CreateJobModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function CreateJobModal({ open, onClose, onCreated }: CreateJobModalProps) {
  const id = useId();
  const { create } = useJobs();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<SkillRequest[]>([]);
  const [skillName, setSkillName] = useState("");
  const [skillWeight, setSkillWeight] = useState("1");
  const [saving, setSaving] = useState(false);

  const addSkill = () => {
    const name = skillName.trim();
    const weight = parseFloat(skillWeight);
    if (!name || isNaN(weight) || weight <= 0) return;
    setSkills((prev) => [...prev, { name, weight }]);
    setSkillName("");
    setSkillWeight("1");
  };

  const removeSkill = (i: number) =>
    setSkills((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const job = await create({ title: title.trim(), description: description.trim() });
      // Add skills sequentially
      for (const s of skills) {
        try {
          await import("@/lib/api").then(({ api }) =>
            api.jobs.addSkill(job.id, s)
          );
        } catch {
          // Non-fatal — skill add failure doesn't block job creation
        }
      }
      toast("Job created successfully!", "success");
      setTitle("");
      setDescription("");
      setSkills([]);
      onCreated();
      onClose();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Failed to create job", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Job Posting" size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-title`} className="text-xs font-medium text-[var(--color-text-secondary)]">
            Job title <span className="text-[var(--color-error)]">*</span>
          </label>
          <Input
            id={`${id}-title`}
            required
            placeholder="e.g. Senior Backend Engineer"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-desc`} className="text-xs font-medium text-[var(--color-text-secondary)]">
            Job description
          </label>
          <textarea
            id={`${id}-desc`}
            rows={4}
            placeholder="Paste the full job description here…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={clsx(
              "w-full px-3 py-2 rounded-[var(--radius-sm)] text-sm resize-y",
              "bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]",
              "border border-[var(--color-border)] focus:border-[var(--color-border-focus)]",
              "placeholder:text-[var(--color-text-tertiary)] outline-none",
              "transition-colors duration-[var(--duration-micro)]"
            )}
          />
        </div>

        {/* Skill editor */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
            Required skills (optional)
          </span>

          {/* Skill input row */}
          <div className="flex gap-2">
            <Input
              placeholder="Skill name"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
              className="flex-1"
            />
            <Input
              type="number"
              min="0.1"
              max="10"
              step="0.1"
              placeholder="Weight"
              value={skillWeight}
              onChange={(e) => setSkillWeight(e.target.value)}
              className="w-24"
            />
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={addSkill}
              disabled={!skillName.trim()}
            >
              Add
            </Button>
          </div>

          {/* Skill chips */}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s, i) => (
                <span
                  key={i}
                  className={clsx(
                    "inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-0.5",
                    "rounded-[var(--radius-pill)] text-xs font-medium",
                    "bg-[var(--color-accent-500)]/15 text-[var(--color-accent-400)]",
                    "border border-[var(--color-accent-500)]/20"
                  )}
                >
                  {s.name}
                  <span className="text-[var(--color-accent-400)]/60">×{s.weight}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(i)}
                    aria-label={`Remove ${s.name}`}
                    className="hover:text-[var(--color-error)] transition-colors"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)] mt-2">
          <Button type="button" variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={saving}
            disabled={!title.trim()}
          >
            Create job
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ---- Jobs Page ----

export default function JobsPage() {
  const { jobs, loading, error, refetch, remove } = useJobs();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await remove(id);
      toast(`"${title}" deleted.`, "info");
    } catch {
      toast("Failed to delete job.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Jobs</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            {loading ? "Loading…" : `${jobs.length} job posting${jobs.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button
          id="create-job-btn"
          variant="primary"
          size="md"
          onClick={() => setCreateOpen(true)}
        >
          <Plus size={15} />
          New job
        </Button>
      </div>

      {/* State: error */}
      {error && (
        <ErrorState
          title="Failed to load jobs"
          message={error}
          onRetry={() => refetch(0)}
        />
      )}

      {/* State: loading */}
      {loading && !error && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      )}

      {/* State: empty */}
      {!loading && !error && jobs.length === 0 && (
      <EmptyState
          icon={<Briefcase size={32} />}
          title="No jobs yet"
          description="Create your first job posting to start ranking candidates."
          action={{ label: "Create job", onClick: () => setCreateOpen(true) }}
        />
      )}

      {/* Job cards */}
      {!loading && !error && jobs.length > 0 && (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card
              key={job.id}
              padding="none"
              className="flex items-start gap-4 px-5 py-4 hover:border-[var(--color-border-focus)] transition-colors group"
            >
              {/* Icon */}
              <div className="shrink-0 w-9 h-9 rounded-[var(--radius-default)] bg-[var(--color-accent-500)]/15 flex items-center justify-center mt-0.5">
                <Briefcase size={16} className="text-[var(--color-accent-400)]" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/jobs/${job.id}`}
                  className="text-sm font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-accent-400)] transition-colors"
                >
                  {job.title}
                </Link>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                  {job.skills.length > 0
                    ? job.skills.map((s) => s.name).join(", ")
                    : "No skills defined"}
                  {" · "}
                  {new Date(job.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link href={`/jobs/${job.id}`}>
                  <Button variant="secondary" size="sm">View</Button>
                </Link>
                <button
                  aria-label={`Delete ${job.title}`}
                  onClick={() => handleDelete(job.id, job.title)}
                  className={clsx(
                    "p-1.5 rounded-[var(--radius-sm)]",
                    "text-[var(--color-text-tertiary)]",
                    "hover:text-[var(--color-error)] hover:bg-[var(--color-error-muted)]",
                    "transition-colors duration-[var(--duration-micro)]"
                  )}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateJobModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => refetch(0)}
      />
    </div>
  );
}
