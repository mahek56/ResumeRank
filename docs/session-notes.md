## Session 1 — Phase 1 complete
- Root files done: .gitignore, .env.example, LICENSE, CONTRIBUTING.md, 
  CHANGELOG.md, docker-compose.yml
- Backend scaffold done: pom.xml, ResumeRankApplication.java, application 
  yml configs, Dockerfile
- AI service scaffold done: requirements.txt, main.py, config.py, router 
  stubs (parse.py, score.py), Dockerfile
- Frontend scaffolded: Next.js 16 (not 15 as plan said — npm pulled latest, 
  need update plan.md/task.md to reflect this), Tailwind v4 @theme inline 
  pattern, installed recharts/cmdk/clsx/lucide-react
- Was running: npx tsc --noEmit to verify frontend types clean — result 
  not yet confirmed
- Next: run mvn clean compile (backend), npm run build (frontend), 
  docker-compose up (verify all 3 services + Postgres talk to each other), 
  then move to Phase 2 (database schema/Flyway migrations)
  ## Session 2 — Phase 2 complete
- Maven Wrapper set up (mvnw.cmd), Java 22 compiling at release 17, works fine
- 6 Flyway migrations created (V1-V6), confirmed in build output, 
  NOT yet run against real Postgres (Docker wasn't installed)
- PENDING: install Docker Desktop, run docker-compose up, verify migrations 
  apply cleanly
- PENDING: check V1__create_users.sql has CREATE EXTENSION IF NOT EXISTS 
  pgcrypto before gen_random_uuid() use — unverified risk
- Next: once Docker verified + pgcrypto confirmed, move to Phase 3 
  (Spring Boot Auth & Core CRUD)
  ## Session 3 — Phase 3 IN PROGRESS (entities only, stopped mid-phase)
- Docker + all 6 migrations verified against real Postgres (Session 2 
  pending items now resolved)
- pgcrypto added to V1 as safety net (PG16 has gen_random_uuid built-in, 
  extension not strictly needed but harmless)
- Phase 3 started: created AppProperties.java, CandidateStatus.java enum, 
  and all 8 JPA entities (User, Job, Skill, Candidate, CandidateSkill, 
  Score, AuditLog, InterviewSummary)
- NOT yet done: repositories, JwtService/JwtAuthFilter, SecurityConfig, 
  AuthController, JobController/SkillController, AuditService, 
  GlobalExceptionHandler
- Next: continue Phase 3 — repositories layer first, then security config, 
  then controllers. Watch: BCrypt cost≥12, httpOnly+Secure+SameSite cookie, 
  CSRF double-submit, Bucket4j rate limit actually wired (not just config), 
  row-level owner check on Job CRUD, no stack trace leak in error responses
  ## Session 4 — Phase 3 nearly complete, hit compile error
- Built: repositories (User/Job/Skill/AuditLog), DTOs, exceptions, 
  GlobalExceptionHandler, JwtService, JwtAuthFilter, SecurityConfig, 
  CorsConfig, RateLimitFilter (custom, not bucket4j-spring-boot-starter), 
  AuditService, AuthController, JobService/Controller, SkillService/
  Controller, AuditController
- SecurityConfig fixed to use .cors(Customizer.withDefaults()) linking 
  CorsConfigurationSource bean
- BLOCKED ON: bucket4j-core 8.x API changed — Bandwidth/Refill import paths 
  different from what pom.xml deps expected. Was mid-fix (searched web for 
  correct 8.10 API) when session hit limit.
- NOT YET VERIFIED: BCrypt cost=12 setting, JWT cookie flags (httpOnly/
  Secure/SameSite), row-level owner check in JobService, GlobalException
  Handler doesn't leak stack trace
- Next: fix bucket4j compile error, run mvnw clean compile, verify the 
  4 security items above, then Phase 4 (FastAPI parse+score)
  ## Session 5 — Phase 4 complete, Phase 5 not started (limit hit)
- Phase 4 fully done: bucket4j fixed (io.github.bucket4j, bucket4j_jdk17-core, 
  v8.14.0, builder API), FastAPI parser.py + scorer.py fully implemented, 
  parse/score routers wired, all verified (BCrypt=12, JWT cookie flags, 
  owner check, no stack trace leak all confirmed)
- Was about to: confirm fuzzy threshold≥80 in scorer.py, verify sentence- 
  transformers loads at startup via /health check
- Phase 5 NOT started: StorageService, LocalStorageService, AiServiceClient, 
  CandidateService (upload→parse→score→persist flow), CandidateController
- Next: verify Phase 4 items above first, then build Phase 5 per 
  implementation_plan.md. Keep scope tight — no retry/circuit-breaker 
  frameworks, match plan exactly, avoid overengineering.
  ## Session 6 — Phase 5 nearly complete
- Phase 4 verified: fuzzy threshold=80 confirmed, /health check ran, 
  currently in TF-IDF fallback mode (sentence-transformers not in local 
  Python env — CONFIRM it's in requirements.txt for Docker build, this is 
  just a local dev env gap not a code issue)
- Phase 5 built: StorageService/LocalStorageService, ParseResponse/
  AiScoreRequest/AiScoreResponse DTOs, CandidateUploadRequest/
  CandidateResponse DTOs, AiServiceClient, CandidateRepository/
  CandidateSkillRepository/ScoreRepository, CandidateService (full 
  orchestration), CandidateController
- Bugs self-caught+fixed: (1) persistScore used wrong findAll() query, 
  fixed to findByCandidate; (2) file input stream reused after already 
  consumed in uploadAndProcess, fixed to read bytes once upfront
- NOT yet done: mvnw clean compile to verify everything compiles together, 
  end-to-end test of upload flow
- Next: compile check, then test actual PDF upload → parse → score → 
  persist flow works, then Phase 6 (dashboard + CSV export)
  ## Session 7 — Phase 5 verified, E2E test blocked (limit hit)
- Phase 5 compile confirmed clean: mvnw clean compile → BUILD SUCCESS, 
  53 source files
- sentence-transformers==4.1.0 + torch==2.7.1 confirmed in requirements.txt 
  — local TF-IDF fallback was just missing local pip install, Docker build 
  will have it correctly
- Docker Desktop was installed but daemon not running — agent launched it, 
  was polling for daemon ready (up to 60s wait) when session hit limit
- E2E test (actual PDF upload → parse → score → persist) STILL NOT RUN — 
  this is the priority for next session
- Phase 6 scoped ahead: CSV export already done in Phase 5 (bonus), so 
  Phase 6 just needs DashboardResponse DTO, DashboardService, 
  DashboardController — lean scope confirmed
- Next: confirm Docker daemon running, run E2E test (upload real PDF, 
  verify parse+score+persist works), THEN build Phase 6 dashboard files

## Session 8 — Phase 6 complete (compile verified)
- Docker Desktop daemon still not responding across multiple sessions (pipe
  not available) — E2E test deferred; Postgres 16 is installed locally but
  password unknown (user chose to skip)
- Phase 6 built and compiled clean (57 source files, BUILD SUCCESS):
  - DashboardResponse.java — nested DTOs: ScoreDistribution (5 bands),
    ScoreRange (min/max/median), StatusFunnel (pending/shortlisted/rejected),
    MissingSkillEntry (skill + count)
  - DashboardRepository.java — JPQL aggregate queries: avg/min/max score,
    sorted scores for median, band counts, status counts, missing_skills JSON
  - DashboardService.java — full aggregation: histogram, median via sorted
    list (no native SQL), status funnel, top-10 missing skills via Java JSON
    parsing + frequency map. Owner check via JobService.assertOwner()
  - DashboardController.java — GET /api/jobs/{id}/dashboard, single endpoint
  - test-upload.sh — E2E bash script (for when Postgres + services are up)
- Note: CSV export was already done in Phase 5 CandidateController.export()
  so Phase 6 was just the dashboard — lean scope fully matched plan.md
- Next: Phase 7 (frontend — Next.js dashboard, upload form, candidate table)
  OR fix E2E test first by resetting Postgres password
  ## Session 8 — Phase 6 complete, Docker rabbit hole (skip going forward)
- Phase 6 fully built: DashboardResponse DTO, DashboardRepository, 
  DashboardService (score distribution, status funnel, top missing skills), 
  DashboardController. Compile clean: BUILD SUCCESS, 57 source files.
- Agent spent significant time trying to get local Postgres running via 
  Docker Desktop (WSL2 pipe issues) then pivoted to installing Postgres 
  natively inside WSL via apt — still incomplete when session hit limit.
- DECISION: STOP trying to fix local Docker/E2E testing for now. Real E2E 
  test will happen after deployment (Phase 11) on the actual live 
  environment — that's what matters for submission. Do not spend further 
  session time on local Docker/WSL/Postgres setup.
- Next: proceed straight to Phase 7 (Frontend: design system, auth pages, 
  layout) — no more local infra debugging, just build features.
  ## Session 9 — Phase 6 confirmed complete, E2E fully deferred
- Phase 6 (dashboard) compile-verified twice: BUILD SUCCESS, 57 source 
  files, no errors
- Extensive Docker/WSL/native-Postgres troubleshooting happened this 
  session (Docker daemon never came up, WSL had no sudo password, found 
  local Windows Postgres 16/17 install but password unknown) — ALL of this 
  is now abandoned, do not revisit
- FINAL DECISION: E2E testing happens only after deployment (Phase 11), 
  on the real live environment. No more local DB/Docker setup attempts 
  under any circumstance until then.
- Next: Phase 7 (Frontend: Design System, Auth & Layout) — pure frontend 
  work, no backend/DB dependency needed for this phase, so no infra risk.
  ## Session 10 — Phase 7 partial (component library mostly done)
- Built: src/lib/types.ts, src/lib/api.ts (fetch wrapper w/ 401 redirect), 
  hooks (useAuth, useJobs, useCandidates, useDashboard), middleware.ts 
  (JWT cookie guard)
- UI components done: Button, Input, Card, Badge, Modal, Toast, Skeleton, 
  Select, Table, Pagination, EmptyState
- NOT yet done: ErrorState.tsx, CommandPalette.tsx, Sidebar.tsx, Header.tsx, 
  auth layout + login/register pages, dashboard layout
- TO VERIFY when reviewing: Toast auto-dismiss ~4s on success (per plan.md 
  spec), Modal has focus trap + Escape-to-close (WCAG requirement)
- Next: finish remaining Phase 7 components (ErrorState, CommandPalette, 
  Sidebar, Header), then auth pages (login/register), then dashboard 
  layout. Still zero DB/Docker dependency needed for rest of Phase 7.
  ## Session 11 — Phase 7 COMPLETE (all components + layouts done)
- VERIFIED: Toast auto-dismiss confirmed at 4000ms (Toast.tsx line 48). 
  Modal focus-trap confirmed (Modal.tsx lines 67-85), Escape-to-close 
  confirmed (Modal.tsx lines 56-64). Both fully WCAG-compliant.
- ErrorState.tsx: already existed from Session 10, confirmed good 
  (AlertCircle icon, title/message/onRetry props, role=alert)
- CommandPalette.tsx: built from scratch with cmdk v1. Self-contained 
  open state, responds to ⌘K / Ctrl+K and openSignal prop (external 
  trigger from Header). Groups: Navigation, Actions, Account. ESC closes 
  overlay.
- Sidebar.tsx: left nav w/ active-state highlight via usePathname, 
  collapsible support, accent logo mark, user avatar + logout button 
  in footer. Location: src/components/layout/Sidebar.tsx
- Header.tsx: sticky breadcrumbs auto-derived from pathname, search 
  button that increments openSignal to trigger CommandPalette. Location: 
  src/components/layout/Header.tsx
- (auth)/layout.tsx: centered card on gradient bg w/ ambient blobs, 
  brand logo, copyright footer. Used for login + register.
- (auth)/login/page.tsx: email + password form, show/hide toggle, 
  error banner, loading state, ?next= redirect on success.
- (auth)/register/page.tsx: name/email/password, 5-segment password 
  strength meter, success flash before redirect, error banner.
- (dashboard)/layout.tsx: sidebar + header + scrollable main content 
  area, ToastProvider wrapping, always-mounted CommandPalette 
  (so ⌘K works from any page), openSignal pattern for external trigger.
- (dashboard)/jobs/page.tsx + (dashboard)/dashboard/page.tsx: stubs 
  for Phase 8 routes, just enough for routing to resolve.
- TypeScript: npx tsc --noEmit → 0 errors (verified twice).
- No Docker/DB dependency introduced — pure frontend, as specified.
- Next: Phase 8 (Jobs list + create form, Candidate upload + table, 
  Dashboard charts with recharts). All routes now scaffolded, layout 
  shell ready to fill in.
## Session 11 — Phase 8 partial (urgent, submitting today)
- Built: (dashboard)/jobs/page.tsx (list + create modal, EmptyState fixed 
  to use {label, onClick} action prop), (dashboard)/jobs/[id]/page.tsx 
  (candidates upload + table)
- URGENT MODE: cutting scope hard per user instruction — no bulk actions, 
  no CSV export UI, no keyboard j/k nav, no fancy dashboard charts (simple 
  list/bar ok), minimal SEO (just title+meta), minimal seed data (1 job, 
  5-6 candidates)
- Next: finish Phase 8 core loop (confirm job create + candidate upload 
  actually render correctly), then Phase 9 minimal (basic dashboard view, 
  basic SEO tags), Phase 10 minimal seed data, then straight to deployment. 
  Skip all polish/bonus features.
  ## Session 12 — Phases 8/9/10 COMPLETE, deployment-ready
- Phase 8 verified: npx tsc --noEmit → 0 errors (confirmed twice, once 
  before and once after Phase 9 additions)
- Phase 9 done:
  - (dashboard)/dashboard/page.tsx: stat cards (total/avg/range/shortlisted),
    pure-CSS score distribution bar chart (no recharts), top missing skills 
    chips, job selector for multi-job. Zero extra deps.
  - app/page.tsx (landing): title tag + meta description exported via Next.js 
    Metadata API, gradient headline, CTA buttons to /register + /login, 
    feature checklist. Minimal but demoable.
- Phase 10 done:
  - V7__seed_demo_data.sql: 1 user (demo@resumerank.dev / Demo1234!, BCrypt 
    cost-12 hash), 1 job "Senior Backend Engineer", 4 skills (Java/Spring 
    Boot/PostgreSQL/Docker), 6 candidates with pre-computed scores ranging 
    22–91 (covers full distribution for demo), statuses: 2 shortlisted, 
    3 pending, 1 rejected.
- Dockerfiles: all 3 services already had Dockerfiles (Phases 1-2). Added 
  frontend/Dockerfile (Node 20 alpine, Next.js standalone output, non-root 
  user), frontend/.dockerignore, wired frontend service into docker-compose.yml.
- DEPLOY CHECKLIST:
  - Backend: Render → New Web Service → Docker, env: SPRING_DATASOURCE_URL, 
    SPRING_DATASOURCE_USERNAME, SPRING_DATASOURCE_PASSWORD, AI_SERVICE_URL, 
    JWT_SECRET (64+ chars), CORS_ALLOWED_ORIGINS (frontend URL)
  - AI service: Render → Docker, no env vars needed beyond port 8000
  - Postgres: Render Postgres (free tier) or Supabase
  - Frontend: Vercel (preferred — zero config for Next.js) or Render Docker;
    set NEXT_PUBLIC_API_URL=https://your-backend-url
  - Seed data runs automatically via Flyway on first backend startup.
  - Demo login: demo@resumerank.dev / Demo1234!
## Session 12 — URGENT deploy fixes
- Fixed: Next.js login page useSearchParams Suspense boundary error
- Fixed: AI service OOM on Render free tier (512MB) — added 
  DISABLE_SENTENCE_TRANSFORMERS env var, skips torch import entirely at 
  startup when set true, goes straight to TF-IDF (config.py + main.py, 
  health endpoint now shows the flag status)
- Next: verify register page doesn't have same useSearchParams issue, 
  redeploy AI service on Render with DISABLE_SENTENCE_TRANSFORMERS=true 
  env var set, retry docker compose up --build locally, then finish 
  Backend + Frontend deploy (Steps 3-4)