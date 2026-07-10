# ResumeRank — Master plan.md

One-line pitch: Upload resumes + a job description, get ranked, explainable match scores so recruiters can shortlist faster.

Built for: Digital Heroes Full Stack Developer Trial (submission requires: live deployed app + public GitHub repo + demo video + case study).

---

## 1. Architecture

```
Recruiter
  ↓
Next.js + TypeScript + Tailwind (frontend, Vercel)
  ↓
Spring Boot (JWT auth, CRUD, orchestration) — Render/Railway
  ↓
PostgreSQL (Neon/Supabase)
  ↓
Python AI Service (FastAPI) — Render/Railway
  ↓
PyMuPDF → spaCy/regex skill extractor → sentence-transformers embeddings
  ↓
Score
```

No LLM in core parsing/scoring path — deterministic, offline, no rate limits, demo-safe. LLM used only for one optional bonus feature (Interview Summary), isolated, not a dependency.

---

## 2. Scope

**In scope (MVP, core submission):**
- JWT auth (Spring Boot), single role (recruiter) for v1
- Job posting CRUD (title, description, skills as normalized rows with weight)
- Resume upload (PDF, file stored + parsed)
- Parse: PyMuPDF → spaCy NER + regex → skills, experience years, education
- Score: sentence-transformers cosine similarity + keyword/skill overlap → composite score
- Score breakdown UI: semantic score, keyword score, matched/missing skills
- Candidate ranking table: sort/filter/search (name, email, skills, status)
- Manual status update (shortlist/reject/pending) — recruiter decides, tool never auto-rejects
- Audit log: score computed, status changed, who/when
- Dashboard (Recharts): candidates per job, avg score, status funnel, **Top Missing Skills** widget
- Command palette (Cmd+K), CSV export, responsive design

**Bonus (only if time remains):**
- LLM-generated Interview Summary (strengths/weaknesses/recommendation) — isolated FastAPI endpoint
- Automated e2e test of critical path
- CI/CD (GitHub Actions: lint, typecheck, test)
- Dark mode (system-aware, no flash)
- Custom domain + polished 404

**Out of scope:**
- Multi-org/multi-tenant, interview scheduling, email notifications, real-time collab, LLM-based parsing

---

## 3. Data shapes

```
User
- id, email, password_hash, created_at

Job
- id, owner_id (fk User), title, description, created_at, updated_at

Skill
- id, job_id (fk Job), name, weight

Candidate
- id, job_id (fk Job), name, email, resume_file_url, raw_text,
  experience_years (int, nullable), education (text, nullable),
  status (enum: pending|shortlisted|rejected), created_at

CandidateSkill
- id, candidate_id (fk Candidate), name, matched (boolean)

Score
- id, candidate_id (fk Candidate), composite_score (float 0-100),
  semantic_score (float), keyword_score (float),
  matched_skills (jsonb array), missing_skills (jsonb array), computed_at

InterviewSummary (optional)
- id, candidate_id (fk Candidate), strengths, weaknesses, recommendation, generated_at

AuditLog
- id, entity_type, entity_id, action, actor_id (fk User), meta (jsonb), created_at
```

## 4. Endpoints

Spring Boot:
- POST /auth/login, /auth/register
- CRUD /api/jobs, CRUD /api/jobs/{id}/skills
- POST /api/candidates (upload → calls FastAPI → persists)
- GET /api/candidates?job_id=&search=&status=&sort=
- PATCH /api/candidates/{id}/status
- GET /api/jobs/{id}/dashboard
- GET /api/candidates/export?job_id=&status=

FastAPI (internal only):
- POST /parse-resume — PDF → {raw_text, skills[], experience_years, education}
- POST /score — → {composite_score, semantic_score, keyword_score, matched_skills, missing_skills}
- POST /interview-summary (optional, LLM)

## 5. Scoring approach

- Semantic: sentence-transformers (all-MiniLM-L6-v2) embed job description + resume text → cosine similarity
- Keyword: fuzzy match job Skills vs CandidateSkills → weighted % coverage
- Composite: default 60% semantic / 40% keyword, always show both parts

## 6. Functional requirements checklist (from trial handbook — table stakes)

**Auth & Access**
- [ ] Password hash Argon2id/bcrypt cost≥12, email verify before write access
- [ ] httpOnly, Secure, SameSite=Lax session cookies, rotate on login/privilege change
- [ ] Password reset: single-use hashed token, 15-30min TTL
- [ ] RBAC enforced server-side (even single-role v1, keep middleware ready to extend)
- [ ] Rate-limit login/reset ~5/15min per IP+account

**Data & CRUD**
- [ ] Full CRUD, server-generated IDs, created_at/updated_at
- [ ] Shared validation both sides (client + Spring Boot)
- [ ] Optimistic UI for toggles/status changes, rollback on failure
- [ ] Explicit pending state, disabled submit during mutation
- [ ] Return mutated record from write (no extra GET)

**Finding Data**
- [ ] Debounced server-side search (~300ms)
- [ ] Filters mirrored into URL query string
- [ ] Sort on indexed columns, stable secondary sort on id
- [ ] Pagination, page size 25/cap 100
- [ ] Distinguish "no matches" vs "no data yet"

**State Coverage**
- [ ] Every async view: loading/empty/error/success, no blank flash
- [ ] Skeletons matching final layout
- [ ] Actionable errors + retry button
- [ ] Empty states with primary CTA
- [ ] Toast every mutation outcome
- [ ] 404 + error boundary on all routes

**Trust & Safety**
- [ ] Auto-escape rendered input, no raw dangerouslySetInnerHTML
- [ ] Row-level authorization (owner check, not just logged-in check)
- [ ] Rate-limit sensitive routes
- [ ] Secrets server-side only, grep client bundle to confirm
- [ ] Parameterized queries/ORM everywhere, allow-list PDF upload MIME+size
- [ ] CSP, HSTS, X-Content-Type-Options headers, CSRF protection

**Beyond basics**
- [ ] CSV export streamed for large sets
- [ ] Bulk shortlist/reject with confirm step
- [ ] Cmd+K palette, j/k nav, / focus search
- [ ] Responsive 320px+, 44px touch targets
- [ ] WCAG 2.1 AA
- [ ] Immutable audit log queryable per entity

## 7. UI/UX spec (hard tokens to follow)

- Spacing: 4px base, 8px rhythm (4,8,12,16,24,32,48,64)
- Type scale: 12/14/16/20/24/32/48px, body 16px line-height 1.5
- Radius: 8px default, 6px inputs, 12px cards/modals, pill 9999px
- Contrast: 4.5:1 body, 3:1 large text/icons (WCAG AA)
- Motion: 150ms micro, 200-250ms transitions, 300ms hard cap, ease-out, respect prefers-reduced-motion
- Font: Inter/Geist Sans (UI) + Geist Mono/JetBrains Mono (numbers/data)
- Focus ring: 2px accent outline + 2px offset, never removed
- Breakpoints: 640/768/1024/1280px, mobile-first
- All 4 states designed first: empty, loading, error, success
- One button/input/card component, driven by shared tokens — no near-duplicates

## 8. Repo structure

```
resumerank/
├── .github/workflows/ci.yml
├── docs/architecture.md, docs/screenshots/
├── backend/          # Spring Boot
├── ai-service/       # FastAPI
├── frontend/         # Next.js
├── .env.example
├── .gitignore
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE (MIT)
└── README.md
```

## 9. README must include

One-line pitch, hero screenshot, live demo link, features list, tech stack, quick start (git clone → env → install → migrate → seed → run), env var table, architecture link, testing commands, demo login (demo@demo.com/demo1234), screenshots, license, credit to Digital Heroes trial.

## 10. Deployment checklist

- [ ] Frontend → Vercel, backend+AI service → Render/Railway (docker-compose), DB → Neon/Supabase
- [ ] All env vars set on each platform, none in repo
- [ ] Migrations run against production DB
- [ ] Live URL loads, zero console errors, no broken images
- [ ] Auth works end-to-end on production
- [ ] Demo login works for a fresh visitor
- [ ] No secret leaked to client bundle (check network tab)
- [ ] OG image renders when pasted into Slack/Twitter

## 11. SEO checklist (landing page at minimum)

- [ ] One h1, one main, semantic landmarks
- [ ] Unique title (50-60 char) + meta description (150-160 char)
- [ ] Canonical tag, robots.txt, sitemap.xml
- [ ] Full OG tags + Twitter card + 1200x630 OG image
- [ ] SoftwareApplication JSON-LD on landing page
- [ ] Lighthouse ≥90 all four categories

## 12. Evaluation criteria mapping (where points come from)

| Criterion | Weight | ResumeRank plan covers it via |
|---|---|---|
| Product Quality | 20% | Core loop: upload→parse→score→rank→shortlist, all 4 states handled |
| UI/UX Craft | 15% | Token system above, dark dev-tool aesthetic, keyboard-first |
| Code Quality | 15% | TS strict frontend, clean Spring Boot layering, no god components |
| Deployment | 12% | 3-service deploy, CI, env documented |
| Documentation | 10% | README + architecture.md + endpoint docs |
| GitHub Professionalism | 10% | Atomic commits, LICENSE, CONTRIBUTING, CHANGELOG |
| SEO | 10% | Section 11 above |
| Originality | 8% | Deterministic scoring (not LLM-lazy), Top Missing Skills insight, transparent breakdown |

## 13. Assumptions

- Single recruiter role sufficient for v1
- PDF only for resume upload, English only
- sentence-transformers small model (all-MiniLM-L6-v2) runs fine on free-tier hosting — verify day one, biggest infra risk

## Do not write implementation until this plan is confirmed.
