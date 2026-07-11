## Session 1 — Phase 1 complete
- Root files done: .gitignore, .env.example, LICENSE, CONTRIBUTING.md, 
  CHANGELOG.md, docker-compose.yml
- Backend scaffold done: pom.xml, ResumeRankApplication.java, application 
  yml configs, Dockerfile
- AI service scaffold done: requirements.txt, main.py, config.py, router 
  stubs (parse.py, score.py), Dockerfile
- Frontend scaffolded: Next.js 16 (not 15 as plan said — npm pulled latest), 
  Tailwind v4 @theme inline pattern, installed recharts/cmdk/clsx/lucide-react
- npx tsc --noEmit: ✅ clean

## Session 2 — Phase 1 verified + Phase 2 complete
- Environment findings: Java 22 (not 17), no Maven, no Docker, no psql
- Fixed Maven: downloaded Maven 3.9.9 locally, then ran `mvn wrapper:wrapper`
  to generate proper mvnw/mvnw.cmd. Future builds use `.\mvnw.cmd` with no 
  global install needed. Downloaded maven dir added to .gitignore.
- Verifications:
  - `npx tsc --noEmit` ✅ clean
  - `.\mvnw.cmd clean compile` ✅ BUILD SUCCESS (compiles with javac release 17 
    on Java 22, fully compatible)
  - `docker compose up` ⚠️ skipped — Docker not installed
- Phase 2 migrations created (V1-V6):
  - V1: users (auto-verified demo mode)
  - V2: jobs + skills (owner FK, cascade, unique constraint)
  - V3: candidates (status enum, composite index)
  - V4: candidate_skills + scores (scoring_method for transparency)
  - V5: audit_logs (immutable, entity-indexed)
  - V6: interview_summaries (bonus table, created for schema completeness)
  - All 6 confirmed included in build ("Copying 6 resources")
  - Cannot verify against live PG without Docker — syntax validated manually
- Next: Phase 3 (Spring Boot Auth & Core CRUD)
  - Start with: SecurityConfig, JwtService, JwtAuthFilter, AuthController
  - Key: CSRF double-submit cookie pattern (user explicitly requested 
    actual implementation, not just mention)
  - Key: BCrypt cost 12, httpOnly Secure SameSite=Lax cookies

## Session 3 — Phase 3 complete
- SecurityConfig, JwtService, JwtAuthFilter, AuthController, User entity/repo
- JobService, SkillService, AuditService + full CRUD controllers
- GlobalExceptionHandler, custom exceptions, PageResponse/ErrorResponse DTOs
- `mvnw.cmd clean compile` ✅ BUILD SUCCESS (40 source files)
- BCrypt strength: bcrypt-strength: ${BCRYPT_STRENGTH:12} in application.yml
- JwtService cookie: httpOnly=true, secure=cookieSecure (prod flag), SameSite=Lax, path=/
- JobService: assertOwner() called in update() and delete() — throws ForbiddenException
- GlobalExceptionHandler: catch-all handleAll(Exception) logs full stack trace
  server-side (log.error) but returns generic 500 message "An unexpected error 
  occurred. Please try again later." — no stack trace leaked to client

## Session 4 — bucket4j compile fix + Phase 4 complete
- Blocked on: RateLimitFilter using deprecated Bucket4j 7.x API
- Root cause 1: pom.xml had bucket4j-core (old artifact name) — doesn't exist in 8.x
- Root cause 2: package changed from io.bucket4j → io.github.bucket4j in 8.x
- Root cause 3: version 8.10.1 doesn't exist on Maven Central; used 8.14.0
- Root cause 4: Bandwidth.classic() + Refill.intervally() removed; use Bandwidth.builder()
- Fixes applied:
  - pom.xml: bucket4j-core:8.10.1 → bucket4j_jdk17-core:8.14.0 (com.bucket4j)
  - RateLimitFilter.java: imports io.github.bucket4j.{Bandwidth,Bucket}
  - RateLimitFilter.java: createBucket() uses Bandwidth.builder().capacity().refillIntervally().build()
  - `mvnw.cmd clean compile` ✅ BUILD SUCCESS (40 source files, 9.2s)
- Phase 4 FastAPI files created:
  - app/models/schemas.py — ParseResponse, ScoreRequest/Response, InterviewSummaryRequest/Response
  - app/utils/skill_taxonomy.py — ~200 normalized skills, normalize_skill_list()
  - app/services/parser.py — PyMuPDF + n-gram skill match + spaCy NER + regex exp/edu
  - app/services/scorer.py — sentence-transformers primary + TF-IDF fallback + weighted fuzzy keyword
  - app/routers/parse.py — POST /parse-resume (full, validates PDF, calls parser)
  - app/routers/score.py — POST /score (full, validates inputs, calls scorer)
  - app/routers/interview.py — POST /interview-summary (stubbed for Phase 13)
  - app/main.py — wired interview router
- Next: Phase 5 (Spring Boot Candidate Flow + StorageService + AiServiceClient)
