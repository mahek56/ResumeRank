# ResumeRank — Architecture

> Full architecture documentation will be written in Phase 12.
> This file is a placeholder to establish the `docs/` directory.

## High-Level Overview

```
Recruiter
  ↓
Next.js 15 + TypeScript + Tailwind v4 (frontend, Vercel)
  ↓
Spring Boot 3.4 (JWT auth, CRUD, orchestration) — Render
  ↓
PostgreSQL 16 (Neon)
  ↓
FastAPI (AI service: parse + score) — Render
  ↓
PyMuPDF → spaCy → sentence-transformers / TF-IDF
  ↓
Score
```
