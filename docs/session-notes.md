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