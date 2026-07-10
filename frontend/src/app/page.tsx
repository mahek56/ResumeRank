/**
 * ResumeRank — Landing page placeholder.
 * Full landing page built in Phase 9 (SEO & Polish).
 */

export default function HomePage() {
  return (
    <main className="flex flex-1 items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
          ResumeRank
        </h1>
        <p className="text-[var(--color-text-secondary)] max-w-md mx-auto">
          Upload resumes + a job description, get ranked explainable match scores
          so recruiters can shortlist faster.
        </p>
      </div>
    </main>
  );
}
