# ResumeRank — Implementation Plan

Upload resumes + a job description, get ranked, explainable match scores so recruiters can shortlist faster. Three-service architecture: Next.js 15 frontend, Spring Boot backend, FastAPI AI service, all backed by PostgreSQL.

---

## User Review Required

> [!IMPORTANT]
> **Tailwind v4 migration:** Tailwind v4 removes `tailwind.config.ts` in favor of CSS-based configuration (`@theme` directives in `globals.css`). All design tokens (colors, spacing, fonts, radii) will be defined in CSS, not a JS config file. This is the correct approach for v4 but differs from most tutorials online.

> [!IMPORTANT]
> **httpOnly cookie vs. Bearer token for JWT:** The plan.md says "httpOnly, Secure, SameSite=Lax session cookies." I'll implement JWT stored in an httpOnly cookie (set by Spring Boot via `Set-Cookie` header), NOT `localStorage` + `Authorization: Bearer` header. This is more secure but means:
> - The frontend never touches the token directly — no `localStorage`, no `Authorization` header.
> - Spring Boot reads the JWT from the cookie on every request.
> - CSRF protection is required (double-submit cookie pattern).
> - Logout is a server-side cookie-clear endpoint.

> [!WARNING]
> **Sentence-transformers on free tier:** The `all-MiniLM-L6-v2` model is ~80MB and needs ~256MB RAM at runtime. Render/Railway free tiers typically offer 512MB. This should work but is tight. The TF-IDF fallback ensures the app still functions if it doesn't. The AI service will log which scoring method is active on startup.

---

## Decided Answers (from clarification round)

| Question | Decision |
|---|---|
| Java version / build tool | Java 17, Maven |
| Next.js version / router | Next.js 15, App Router |
| Tailwind version | v4 (CSS-based config) |
| DB migrations | Flyway (versioned SQL in git) |
| Resume file storage | Local filesystem behind `StorageService` interface |
| Email verification | Auto-verified (demo mode), documented as scope cut |
| Password reset | Stubbed (token logged to console in dev), documented as scope cut |
| Seed data | 2 jobs × 12–15 candidates, mixed score range |
| Scoring fallback | TF-IDF cosine similarity if sentence-transformers fails to load |
| Package manager | npm |

---

## Proposed Changes

The implementation is split into 10 phases, ordered by dependency. Each phase is self-contained and testable before moving to the next.

---

### Phase 1 — Project Scaffolding & Infrastructure

Set up all three projects, Docker Compose for local dev, and shared configuration.

#### [NEW] Root-level files

| File | Purpose |
|---|---|
| `docker-compose.yml` | PostgreSQL + backend + ai-service for local dev |
| `.env.example` | All env vars with placeholder values, documented |
| `.gitignore` | Java build output, node_modules, Python venv, .env, uploads/ |
| `LICENSE` | MIT |
| `CONTRIBUTING.md` | Contribution guidelines |
| `CHANGELOG.md` | Starts empty, will be updated with each phase |

#### [NEW] `backend/` — Spring Boot scaffold

```
backend/
├── pom.xml                          # Java 17, Spring Boot 3.3+, deps below
├── Dockerfile                       # Multi-stage: Maven build → JRE 17 slim
├── src/main/java/com/resumerank/
│   └── ResumeRankApplication.java   # @SpringBootApplication entry point
├── src/main/resources/
│   ├── application.yml              # Common config
│   ├── application-dev.yml          # Dev overrides (H2 optional, local PG)
│   └── application-prod.yml         # Prod overrides (Neon URL, cookie flags)
```

**Maven dependencies:**
- `spring-boot-starter-web`
- `spring-boot-starter-data-jpa` (Hibernate)
- `spring-boot-starter-security`
- `spring-boot-starter-validation`
- `flyway-core` + `flyway-database-postgresql`
- `postgresql` (runtime)
- `jjwt-api`, `jjwt-impl`, `jjwt-jackson` (io.jsonwebtoken, 0.12+)
- `spring-boot-starter-test` (test)
- `bucket4j-core` + `bucket4j-spring-boot-starter` (rate limiting)
- `commons-csv` (Apache, for CSV export)

#### [NEW] `ai-service/` — FastAPI scaffold

```
ai-service/
├── requirements.txt
├── Dockerfile                       # Python 3.11 slim, pip install, uvicorn
├── app/
│   ├── __init__.py
│   ├── main.py                      # FastAPI app, lifespan (model loading)
│   └── config.py                    # Settings via pydantic-settings
├── tests/
│   └── __init__.py
```

**Python dependencies:**
- `fastapi`, `uvicorn[standard]`
- `pymupdf` (fitz)
- `spacy` (+ `en_core_web_sm` model)
- `sentence-transformers` (+ `torch` CPU-only)
- `scikit-learn` (TF-IDF fallback)
- `pydantic`, `pydantic-settings`
- `pytest`, `httpx` (test)

#### [NEW] `frontend/` — Next.js 15 scaffold

```bash
npx -y create-next-app@latest ./frontend \
  --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --use-npm --turbopack
```

Post-scaffold adjustments:
- Remove default boilerplate pages/styles
- Set up Tailwind v4 CSS-based config in `src/app/globals.css`
- Install: `recharts`, `cmdk` (command palette), `clsx`, `lucide-react` (icons)
- Configure `next.config.ts`: `output: 'standalone'`, image domains, env exposure

---

### Phase 2 — Database Schema & Migrations (Flyway)

All tables created via versioned Flyway SQL scripts committed to `backend/src/main/resources/db/migration/`.

#### [NEW] `V1__create_users.sql`

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT TRUE,  -- auto-verified (demo mode)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### [NEW] `V2__create_jobs_and_skills.sql`

```sql
CREATE TABLE jobs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES users(id),
  title       VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_jobs_owner ON jobs(owner_id);

CREATE TABLE skills (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id  UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  name    VARCHAR(100) NOT NULL,
  weight  REAL NOT NULL DEFAULT 1.0,
  UNIQUE(job_id, name)
);
CREATE INDEX idx_skills_job ON skills(job_id);
```

#### [NEW] `V3__create_candidates.sql`

```sql
CREATE TYPE candidate_status AS ENUM ('pending', 'shortlisted', 'rejected');

CREATE TABLE candidates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id           UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  name             VARCHAR(255) NOT NULL,
  email            VARCHAR(255),
  resume_file_url  TEXT NOT NULL,
  raw_text         TEXT,
  experience_years INTEGER,
  education        TEXT,
  status           candidate_status NOT NULL DEFAULT 'pending',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_candidates_job ON candidates(job_id);
CREATE INDEX idx_candidates_status ON candidates(job_id, status);
```

#### [NEW] `V4__create_candidate_skills_and_scores.sql`

```sql
CREATE TABLE candidate_skills (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  name         VARCHAR(100) NOT NULL,
  matched      BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_cskills_candidate ON candidate_skills(candidate_id);

CREATE TABLE scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id    UUID NOT NULL UNIQUE REFERENCES candidates(id) ON DELETE CASCADE,
  composite_score REAL NOT NULL,
  semantic_score  REAL NOT NULL,
  keyword_score   REAL NOT NULL,
  scoring_method  VARCHAR(50) NOT NULL DEFAULT 'sentence-transformers',
  matched_skills  JSONB NOT NULL DEFAULT '[]',
  missing_skills  JSONB NOT NULL DEFAULT '[]',
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### [NEW] `V5__create_audit_log.sql`

```sql
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id   UUID NOT NULL,
  action      VARCHAR(100) NOT NULL,
  actor_id    UUID NOT NULL REFERENCES users(id),
  meta        JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
```

#### [NEW] `V6__create_interview_summary.sql` (bonus table, created now for schema completeness)

```sql
CREATE TABLE interview_summaries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id   UUID NOT NULL UNIQUE REFERENCES candidates(id) ON DELETE CASCADE,
  strengths      TEXT,
  weaknesses     TEXT,
  recommendation TEXT,
  generated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### Phase 3 — Spring Boot Backend: Auth & Core CRUD

#### [NEW] `config/SecurityConfig.java`
- `SecurityFilterChain`: stateless sessions, CSRF via double-submit cookie, CORS configured for frontend origin, public paths (`/auth/**`), all others authenticated.
- `PasswordEncoder`: BCrypt with cost 12.
- Security headers: CSP, HSTS, X-Content-Type-Options, X-Frame-Options.

#### [NEW] `config/JwtProperties.java`
- `@ConfigurationProperties("app.jwt")`: secret, expiration (24h), cookie name.

#### [NEW] `config/CorsConfig.java`
- Allow frontend origin (configurable via env), credentials: true.

#### [NEW] `config/RateLimitConfig.java`
- Bucket4j configuration: 5 requests / 15 min on `/auth/login` and `/auth/reset-password` per IP.

#### [NEW] `auth/JwtService.java`
- `generateToken(User)`, `validateToken(String)`, `extractUserId(String)`.
- Token set as httpOnly, Secure (prod), SameSite=Lax cookie.
- Token rotated on login.

#### [NEW] `auth/JwtAuthFilter.java`
- `OncePerRequestFilter`: reads JWT from cookie, validates, sets `SecurityContext`.

#### [NEW] `auth/AuthController.java`
- `POST /auth/register` — validate, hash password, auto-verify, return user (no token in body).
- `POST /auth/login` — verify credentials, set JWT cookie, return user profile.
- `POST /auth/logout` — clear JWT cookie.
- `POST /auth/reset-password` — stubbed: generate token, log to console, return 200.
- `GET /auth/me` — return current user from JWT.

#### [NEW] `auth/dto/` — `LoginRequest`, `RegisterRequest`, `AuthResponse`

#### [NEW] `user/User.java` (JPA entity), `user/UserRepository.java`

#### [NEW] `job/Job.java`, `job/JobRepository.java`, `job/JobService.java`, `job/JobController.java`
- Full CRUD: `POST /api/jobs`, `GET /api/jobs`, `GET /api/jobs/{id}`, `PUT /api/jobs/{id}`, `DELETE /api/jobs/{id}`.
- Owner check on all mutations (row-level auth).
- Return mutated record from write operations (no extra GET).
- `created_at` / `updated_at` managed via `@PrePersist` / `@PreUpdate`.

#### [NEW] `skill/Skill.java`, `skill/SkillRepository.java`, `skill/SkillController.java`
- `POST /api/jobs/{id}/skills`, `GET /api/jobs/{id}/skills`, `PUT /api/jobs/{jobId}/skills/{skillId}`, `DELETE /api/jobs/{jobId}/skills/{skillId}`.
- Bulk set endpoint: `PUT /api/jobs/{id}/skills` (replace all skills at once — useful for frontend skill editor).

#### [NEW] `audit/AuditLog.java`, `audit/AuditLogRepository.java`, `audit/AuditService.java`
- `AuditService.log(entityType, entityId, action, actorId, meta)` — called from service layer on every mutation.
- Immutable: insert only, no update/delete endpoints.
- `GET /api/audit?entity_type=&entity_id=` — queryable per entity.

#### [NEW] `common/dto/` — `PageResponse<T>` (paginated wrapper), `ErrorResponse`

#### [NEW] `common/exception/` — `GlobalExceptionHandler` (`@ControllerAdvice`), custom exceptions (`NotFoundException`, `ForbiddenException`, `ValidationException`)

---

### Phase 4 — FastAPI AI Service: Parse & Score

#### [NEW] `app/models/schemas.py`

Pydantic models for request/response:
```python
class ParseRequest:    pdf_bytes: bytes (via UploadFile)
class ParseResponse:   raw_text, skills: list[str], experience_years: int|None, education: str|None

class ScoreRequest:    job_description: str, job_skills: list[SkillWeight], resume_text: str, candidate_skills: list[str]
class ScoreResponse:   composite_score: float, semantic_score: float, keyword_score: float,
                       matched_skills: list[str], missing_skills: list[str], scoring_method: str
```

#### [NEW] `app/services/parser.py`

1. **PDF extraction:** PyMuPDF (`fitz`) → raw text.
2. **Skill extraction:** spaCy `en_core_web_sm` NER + regex patterns against a curated skill taxonomy (~200 common tech skills).
3. **Experience extraction:** Regex for patterns like "5 years", "5+ years of experience".
4. **Education extraction:** Regex for degree keywords (B.S., M.S., PhD, Bachelor, Master) + university name via NER (ORG entities near education keywords).

#### [NEW] `app/services/scorer.py`

1. **Startup:** Try loading `all-MiniLM-L6-v2`. If OOM/fails → log warning, set `scoring_method = "tfidf"`.
2. **Semantic score (sentence-transformers path):**
   - Encode job description → embedding, encode resume text → embedding.
   - Cosine similarity → normalize to 0–100.
3. **Semantic score (TF-IDF fallback):**
   - `TfidfVectorizer` fit on [job_description, resume_text].
   - Cosine similarity on TF-IDF vectors → normalize to 0–100.
4. **Keyword score:**
   - Fuzzy match (token set ratio, threshold ≥ 80) each job skill against candidate skills.
   - Weighted coverage: `Σ(matched_skill_weight) / Σ(all_skill_weight) × 100`.
5. **Composite:** `0.6 × semantic + 0.4 × keyword`.
6. **Response** includes `scoring_method` field ("sentence-transformers" or "tfidf").

#### [NEW] `app/utils/skill_taxonomy.py`
- Curated list of ~200 normalized skill names (e.g., "JavaScript", "React", "Python", "AWS", "Docker").
- Used by parser to normalize extracted skills to canonical forms.

#### [NEW] `app/routers/parse.py` — `POST /parse-resume`
#### [NEW] `app/routers/score.py` — `POST /score`
#### [NEW] `app/routers/interview.py` — `POST /interview-summary` (bonus, stubbed initially)

#### [NEW] `app/main.py`
- FastAPI app with lifespan handler (load spaCy model + sentence-transformers on startup).
- Health check: `GET /health` returning model status and scoring method.
- Internal-only: no auth on these endpoints (called only by Spring Boot backend).

---

### Phase 5 — Spring Boot Backend: Candidate Flow

The critical path: upload → parse → score → persist → return.

#### [NEW] `storage/StorageService.java` (interface)

```java
public interface StorageService {
    String store(MultipartFile file, String subPath);
    Resource load(String filePath);
    void delete(String filePath);
}
```

#### [NEW] `storage/LocalStorageService.java`
- Implements `StorageService`, stores files under `./uploads/{jobId}/{candidateId}.pdf`.
- Validates: PDF MIME type, max 10MB.

#### [NEW] `aiservice/AiServiceClient.java`
- Spring `RestClient` (Spring Boot 3.2+) calls to FastAPI.
- `parseResume(byte[] pdf)` → `ParseResponse`.
- `scoreCandidate(ScoreRequest)` → `ScoreResponse`.
- Timeout: 30s connect, 60s read (model inference can be slow).
- Error handling: if FastAPI is down, return clear error (don't swallow).

#### [NEW] `candidate/Candidate.java`, `candidate/CandidateSkill.java` (JPA entities)
#### [NEW] `candidate/CandidateRepository.java`
- Custom query methods for search/filter/sort/pagination:
  - `findByJobIdAndFilters(jobId, search, status, pageable)` — Spring Data JPA `Specification` or `@Query`.
  - Search: ILIKE on `name`, `email`, candidate skill names.
  - Sort: `composite_score`, `name`, `created_at` + secondary sort on `id` for stability.

#### [NEW] `candidate/CandidateService.java`
- `uploadAndProcess(jobId, MultipartFile, userId)`:
  1. Validate PDF (MIME + size).
  2. Store via `StorageService`.
  3. Call `AiServiceClient.parseResume()`.
  4. Persist `Candidate` + `CandidateSkill` rows.
  5. Build `ScoreRequest` from parsed data + job description + job skills.
  6. Call `AiServiceClient.scoreCandidate()`.
  7. Persist `Score`.
  8. Write `AuditLog` entry.
  9. Return full candidate with score.

- `updateStatus(candidateId, newStatus, userId)`:
  1. Owner check (candidate's job must belong to user).
  2. Update status.
  3. Write `AuditLog`.
  4. Return updated candidate.

- `bulkUpdateStatus(candidateIds, newStatus, userId)`:
  1. Validate all belong to same job owned by user.
  2. Batch update.
  3. Write `AuditLog` per candidate.

#### [NEW] `candidate/CandidateController.java`
- `POST /api/candidates` — multipart: file + jobId.
- `GET /api/candidates?job_id=&search=&status=&sort=&page=&size=` — paginated, filterable.
- `PATCH /api/candidates/{id}/status` — single status update.
- `PATCH /api/candidates/bulk-status` — bulk shortlist/reject.
- `GET /api/candidates/export?job_id=&status=` — CSV, streamed.

#### [NEW] `score/Score.java`, `score/ScoreRepository.java`

---

### Phase 6 — Spring Boot Backend: Dashboard & Export

#### [NEW] `dashboard/DashboardService.java`
- `getDashboard(jobId, userId)` returns:
  - `totalCandidates`, `avgScore`, `scoreDistribution` (histogram buckets: 0-20, 20-40, 40-60, 60-80, 80-100).
  - `statusFunnel`: { pending: N, shortlisted: N, rejected: N }.
  - `topMissingSkills`: aggregate `missing_skills` across all candidates for this job, count frequency, return top 10.
  - `scoreRange`: { min, max, median }.

#### [NEW] `dashboard/DashboardController.java`
- `GET /api/jobs/{id}/dashboard` — owner check, returns dashboard DTO.

#### CSV Export (in `CandidateController`)
- `GET /api/candidates/export?job_id=&status=` — streams CSV via `StreamingResponseBody`.
- Columns: name, email, composite_score, semantic_score, keyword_score, matched_skills, missing_skills, status, experience_years, education.
- Uses Apache Commons CSV.

---

### Phase 7 — Frontend: Design System, Auth & Layout

#### [NEW] `src/app/globals.css` — Tailwind v4 design system

All design tokens defined via `@theme`:
```css
@import "tailwindcss";

@theme {
  --color-bg-primary: #0a0a0f;
  --color-bg-secondary: #12121a;
  --color-bg-elevated: #1a1a26;
  --color-accent-500: #6366f1;     /* indigo */
  --color-accent-400: #818cf8;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  /* ... full palette, spacing scale, radii, shadows, font sizes */
  --radius-default: 8px;
  --radius-input: 6px;
  --radius-card: 12px;
  --radius-pill: 9999px;
  --font-sans: 'Inter', 'Geist Sans', system-ui, sans-serif;
  --font-mono: 'Geist Mono', 'JetBrains Mono', monospace;
}
```

Dark dev-tool aesthetic: deep navy/charcoal background, indigo accent, clean whites for text.

#### [NEW] `src/components/ui/` — Shared component library

Single source of truth for each primitive, driven by tokens:

| Component | Variants / Notes |
|---|---|
| `Button.tsx` | `primary`, `secondary`, `ghost`, `danger`; sizes `sm`, `md`, `lg`; loading state with spinner |
| `Input.tsx` | Text, email, password; with label, error message, disabled state |
| `Card.tsx` | Elevated surface, consistent radius + shadow |
| `Badge.tsx` | Status colors: pending (amber), shortlisted (green), rejected (red) |
| `Modal.tsx` | Overlay + focus trap, close on Escape |
| `Toast.tsx` | Success/error/info; auto-dismiss 5s; stacked position bottom-right |
| `Skeleton.tsx` | Matches final layout dimensions for loading states |
| `Select.tsx` | Styled dropdown for filters |
| `Table.tsx` | Responsive, sortable headers, row hover |
| `Pagination.tsx` | Page numbers + prev/next, size selector (25/50/100) |
| `EmptyState.tsx` | Illustration + message + primary CTA |
| `ErrorState.tsx` | Error message + retry button |

#### [NEW] `src/lib/api.ts`
- Fetch wrapper: base URL from env, credentials: 'include' (cookies), JSON headers.
- Auto-handle 401 → redirect to login.
- Typed response handling.

#### [NEW] `src/lib/types.ts`
- TypeScript interfaces mirroring all backend DTOs: `User`, `Job`, `Skill`, `Candidate`, `Score`, `AuditLog`, `DashboardData`, `PageResponse<T>`.

#### [NEW] `src/lib/hooks/`
- `useAuth()` — auth state, login/register/logout mutations.
- `useJobs()` — job list, CRUD mutations with optimistic UI.
- `useCandidates(jobId, filters)` — paginated candidate list, debounced search (300ms).
- `useDashboard(jobId)` — dashboard data.
- Custom hooks using `useEffect` + `useState` or a thin wrapper (no heavy lib like React Query — keep deps minimal).

#### [NEW] `src/middleware.ts`
- Next.js middleware: check for JWT cookie, redirect unauthenticated users from `/jobs/**` to `/login`.

#### [NEW] Auth pages

| File | Purpose |
|---|---|
| `src/app/(auth)/layout.tsx` | Centered layout, branding |
| `src/app/(auth)/login/page.tsx` | Email + password form, validation, error handling |
| `src/app/(auth)/register/page.tsx` | Email + password + confirm, validation |

#### [NEW] Authenticated layout

| File | Purpose |
|---|---|
| `src/app/(dashboard)/layout.tsx` | Sidebar nav + header + main content area |
| `src/components/layout/Sidebar.tsx` | Nav links: Jobs, collapsible, responsive (drawer on mobile) |
| `src/components/layout/Header.tsx` | User menu, logout, Cmd+K trigger |
| `src/components/layout/CommandPalette.tsx` | `cmdk` powered: navigate to jobs, search candidates, quick actions |

---

### Phase 8 — Frontend: Core Features

#### [NEW] Job management

| File | Purpose |
|---|---|
| `src/app/(dashboard)/jobs/page.tsx` | Job list with cards, create button. All 4 states. |
| `src/app/(dashboard)/jobs/new/page.tsx` | Create job form with inline skill editor |
| `src/app/(dashboard)/jobs/[id]/page.tsx` | Job detail view — overview + quick stats + link to candidates & dashboard |
| `src/app/(dashboard)/jobs/[id]/edit/page.tsx` | Edit job + skill editor |
| `src/components/jobs/JobCard.tsx` | Card: title, candidate count, avg score, created date |
| `src/components/jobs/JobForm.tsx` | Shared form for create/edit |
| `src/components/jobs/SkillEditor.tsx` | Add/remove skills with weight slider, tag-style UI |

#### [NEW] Candidate ranking table

| File | Purpose |
|---|---|
| `src/app/(dashboard)/jobs/[id]/candidates/page.tsx` | Main ranking view |
| `src/components/candidates/CandidateTable.tsx` | Sortable columns: name, email, composite score, status, created_at. Clickable rows expand to score breakdown. |
| `src/components/candidates/ScoreBreakdown.tsx` | Expandable row detail: semantic score bar, keyword score bar, matched skills (green badges), missing skills (red badges), scoring method indicator |
| `src/components/candidates/StatusBadge.tsx` | Color-coded status with dropdown to change |
| `src/components/candidates/BulkActions.tsx` | Select multiple → bulk shortlist/reject with confirmation modal |
| `src/components/candidates/UploadResume.tsx` | Drag-and-drop zone + file picker, shows progress, handles errors |
| `src/components/candidates/SearchFilterBar.tsx` | Search input (debounced) + status filter dropdown + sort selector. All filters mirrored into URL query string. |
| `src/components/candidates/CsvExportButton.tsx` | Triggers download of CSV export |

**Keyboard navigation:** `j`/`k` to move between rows, `Enter` to expand, `/` to focus search.

**Optimistic UI:** Status change updates UI immediately, rolls back on server error with toast.

#### [NEW] Score breakdown details

The score breakdown for each candidate shows:
- **Composite score** — large number with color gradient (red → amber → green by value)
- **Semantic score** — horizontal bar, labeled "Content Match"
- **Keyword score** — horizontal bar, labeled "Skill Match"
- **Scoring method** — subtle label: "via sentence-transformers" or "via TF-IDF fallback"
- **Matched skills** — green badges
- **Missing skills** — red/gray badges
- **Experience** — years if extracted
- **Education** — if extracted

---

### Phase 9 — Frontend: Dashboard & Polish

#### [NEW] Dashboard page

| File | Purpose |
|---|---|
| `src/app/(dashboard)/jobs/[id]/dashboard/page.tsx` | Dashboard layout with chart grid |
| `src/components/dashboard/ScoreDistribution.tsx` | Recharts `BarChart` — histogram of score buckets |
| `src/components/dashboard/StatusFunnel.tsx` | Recharts `PieChart` or horizontal stacked bar — pending/shortlisted/rejected |
| `src/components/dashboard/TopMissingSkills.tsx` | Recharts horizontal `BarChart` — top 10 missing skills by frequency. This is the **key insight widget**: tells recruiters what skills their candidate pool is weakest in. |
| `src/components/dashboard/StatCard.tsx` | Metric card: total candidates, avg score, score range |

#### SEO & Landing page

| File | Purpose |
|---|---|
| `src/app/page.tsx` | Public landing page: hero, features, CTA to register. Single `<h1>`, semantic HTML. |
| `src/app/layout.tsx` | Root metadata: title (50-60 chars), meta description (150-160 chars), OG tags, Twitter card, canonical, JSON-LD (SoftwareApplication). |
| `public/robots.txt` | Allow all |
| `public/sitemap.xml` | Static: landing, login, register |
| `public/og-image.png` | 1200×630 OG image (generated via image tool) |
| `src/app/not-found.tsx` | Custom 404 page |
| `src/app/error.tsx` | Root error boundary |

#### Responsive & Accessibility

- Mobile-first: 320px minimum. Breakpoints: 640/768/1024/1280px.
- 44px minimum touch targets.
- Focus ring: 2px accent outline + 2px offset on all interactive elements.
- `prefers-reduced-motion`: disable all transitions/animations.
- Semantic HTML: `<main>`, `<nav>`, `<section>`, proper ARIA labels.
- Color contrast: 4.5:1 body text, 3:1 large text/icons.

---

### Phase 10 — Seed Data & Demo Login

#### [NEW] `V7__seed_demo_data.sql` (Flyway, runs only in dev/demo profile)

**Demo user:**
- Email: `demo@demo.com`, password: `demo1234` (bcrypt hashed).

**Job 1: "Senior Full Stack Developer"**
- Skills: React (weight 1.5), TypeScript (1.5), Node.js (1.2), PostgreSQL (1.0), Docker (0.8), AWS (0.8), GraphQL (0.6), CI/CD (0.6)
- 13 candidates with pre-computed scores ranging from 25 to 92, mixed statuses.

**Job 2: "ML Engineer"**
- Skills: Python (1.5), PyTorch (1.5), TensorFlow (1.0), MLOps (1.0), Kubernetes (0.8), SQL (0.8), Spark (0.6)
- 12 candidates with scores ranging from 18 to 88, mixed statuses.

Seed data includes:
- Pre-populated `candidates`, `candidate_skills`, `scores`, `audit_logs`.
- Realistic names, diverse skill sets, some candidates strong on semantic but weak on keywords (and vice versa) to demonstrate the value of the composite score.
- Enough "missing skills" variety to make the Top Missing Skills dashboard widget meaningful.

---

### Phase 11 — Deployment

| Component | Platform | Config |
|---|---|---|
| Frontend | Vercel | Connect GitHub repo, root: `frontend/`, framework: Next.js, env vars: `NEXT_PUBLIC_API_URL` |
| Backend | Render (Docker) | Dockerfile in `backend/`, env vars: DB URL, JWT secret, AI service URL, CORS origin |
| AI Service | Render (Docker) | Dockerfile in `ai-service/`, env vars: minimal. **512MB+ RAM plan required.** |
| Database | Neon | Free tier PostgreSQL, connection string → backend env |

Docker considerations:
- AI service Dockerfile: install spaCy model in build step (`python -m spacy download en_core_web_sm`).
- Backend Dockerfile: multi-stage Maven build.
- `uploads/` directory: on Render, local disk is ephemeral. For MVP demo this is acceptable (seed data doesn't need actual PDF files for scores). Document this limitation in README.

---

### Phase 12 — Documentation

#### [NEW] `README.md`
Per plan Section 9: one-line pitch, hero screenshot, live demo link, features, tech stack, quick start guide, env var table, architecture link, testing commands, demo login, screenshots, license, Digital Heroes credit.

#### [NEW] `docs/architecture.md`
- Architecture diagram (Mermaid).
- Data flow: upload → parse → score → persist → display.
- Scoring algorithm explanation.
- Security model.
- Deployment topology.

#### [MODIFY] `CHANGELOG.md`
- Document all phases completed.

---

### Phase 13 — Bonus Features (only if time remains)

Ordered by impact:

1. **Dark mode** (system-aware, no flash)
   - Use `next-themes` or CSS `prefers-color-scheme` media query.
   - Add light palette to `@theme` alongside existing dark.
   - Cookie-based preference to avoid FOUC.

2. **LLM Interview Summary**
   - `POST /interview-summary` on FastAPI: takes candidate data, calls an LLM API (e.g., Groq free tier for Llama 3), returns strengths/weaknesses/recommendation.
   - Frontend: "Generate Summary" button on candidate detail, shows in a card.
   - Completely isolated — app works without it.

3. **CI/CD (GitHub Actions)**
   - `ci.yml`: on push/PR → lint frontend, typecheck, run backend tests, run AI service tests.

4. **E2E test**
   - Playwright: register → create job → upload resume → verify score appears → shortlist → verify status.

---

## Verification Plan

### Automated Tests

**Backend (Spring Boot):**
```bash
cd backend && mvn test
```
- Unit tests: `JwtService`, `CandidateService` (mock AI client), `DashboardService`.
- Integration test: full candidate upload flow with `MockMvc` + embedded PostgreSQL (`@Testcontainers` or H2 in PostgreSQL compatibility mode).

**AI Service (FastAPI):**
```bash
cd ai-service && pytest
```
- Unit tests: parser (with sample PDF bytes), scorer (with known inputs → expected score range).
- Integration test: `/parse-resume` and `/score` endpoints via `httpx.AsyncClient`.

**Frontend:**
```bash
cd frontend && npm run lint && npx tsc --noEmit
```
- Lint + type-check (no runtime tests for MVP unless bonus phase reached).

### Manual Verification

1. **Core loop test:** Register → create job with skills → upload 3 PDF resumes → verify scores appear → sort by score → shortlist top, reject bottom → verify audit log → check dashboard charts.
2. **Demo login:** Visit live URL → login as `demo@demo.com` / `demo1234` → verify seed data visible, dashboard populated, Top Missing Skills widget shows data.
3. **Security spot-checks:**
   - Verify JWT is in httpOnly cookie (not visible in JS console via `document.cookie`).
   - Verify accessing another user's job returns 403.
   - Verify client bundle contains no secrets (`grep` network tab / source).
4. **Responsive:** Test at 320px, 768px, 1280px.
5. **Lighthouse:** Run on landing page, target ≥90 all categories.
6. **Empty/error states:** Access jobs page with no jobs → verify empty state with CTA. Kill AI service → upload resume → verify error state with retry.
