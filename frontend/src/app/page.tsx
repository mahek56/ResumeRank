import type { Metadata } from "next";
import Link from "next/link";
import { Zap, ArrowRight, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "ResumeRank — AI-Powered Resume Ranking for Recruiters",
  description:
    "Upload PDF resumes and a job description, get ranked explainable match scores in seconds. Help recruiters shortlist faster with transparent, deterministic AI scoring.",
};

const FEATURES = [
  "Upload multiple PDF resumes at once",
  "AI-scored with semantic + keyword matching",
  "Ranked by composite score — shortlist in one click",
  "Explainable scores: matched & missing skills shown",
];

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center relative overflow-hidden">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse, oklch(0.585 0.19 270 / 0.4) 0%, transparent 70%)",
        }}
      />

      {/* Logo mark */}
      <div className="flex items-center gap-2.5 mb-8">
        <div
          className="w-10 h-10 rounded-[12px] flex items-center justify-center"
          style={{
            background: "var(--color-accent-500)",
            boxShadow: "var(--shadow-glow)",
          }}
        >
          <Zap size={20} className="text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
          ResumeRank
        </span>
      </div>

      {/* Headline */}
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)] max-w-2xl leading-tight">
        Rank resumes with{" "}
        <span
          className="text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(135deg, oklch(0.68 0.16 270), oklch(0.585 0.19 270))",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
          }}
        >
          explainable AI
        </span>
      </h1>

      <p className="mt-5 text-base sm:text-lg text-[var(--color-text-secondary)] max-w-xl">
        Upload PDF resumes, get match scores ranked by skill fit.
        Shortlist candidates in seconds — not hours.
      </p>

      {/* CTA buttons */}
      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/register"
          id="cta-get-started"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-default)] text-sm font-semibold text-white transition-all hover:opacity-90 active:opacity-80"
          style={{ background: "var(--color-accent-500)", boxShadow: "var(--shadow-glow)" }}
        >
          Get started free <ArrowRight size={15} />
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-default)] text-sm font-medium text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-focus)] hover:text-[var(--color-text-primary)] transition-all"
        >
          Sign in
        </Link>
      </div>

      {/* Feature list */}
      <ul className="mt-12 flex flex-col items-center gap-2">
        {FEATURES.map((f) => (
          <li
            key={f}
            className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]"
          >
            <CheckCircle2 size={14} className="text-[var(--color-success)] shrink-0" />
            {f}
          </li>
        ))}
      </ul>
    </main>
  );
}
