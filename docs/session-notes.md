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
