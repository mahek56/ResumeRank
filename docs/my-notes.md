ResumeRank — Decision Summary (why, not just what)
Core idea
Recruiter upload job + resumes → tool score/rank candidate → recruiter decide shortlist/reject. Tool assist, never auto-decide — important trust point.
Why 3 separate service, not one monolith

Spring Boot = business logic, auth, data — your strongest stack (matches resume: FastAPI+Spring Boot combo from LexAI project).
FastAPI = isolated AI/ML work (parsing, scoring) — Python best fit for spaCy/sentence-transformers, keep heavy ML dep away from Java app.
Next.js = frontend only, talk to Spring Boot API.
Split = each piece testable/scalable alone, plus show polyglot skill (not just "I know one framework").

Why JWT in httpOnly cookie, not localStorage

localStorage readable by any JS on page — if XSS attack happen (malicious script inject), attacker steal token instantly.
httpOnly cookie = JavaScript literally cannot read it — browser sends automatically, script never touch it. Much safer.
Trade-off: need CSRF protection now (since cookie auto-send on every request, including cross-site). Handled via double-submit cookie pattern (extra token check beyond just cookie presence).

Why deterministic scoring (spaCy+regex+sentence-transformers), not LLM parsing

LLM in critical path = slow (API call), can fail (rate limit/API down), unreliable JSON output (need retry/validation logic).
Deterministic = fast, offline, free, always same input→same output (reproducible), demo never break due to API hiccup.
Trade-off: slightly less "smart" at edge-case resume format vs LLM — acceptable, documented as known limitation.

Two-part score, not single number

Semantic score: sentence-transformers embed job description + resume text → cosine similarity → "does this resume sound like it fit the role overall."
Keyword score: fuzzy-match required skills list vs candidate's extracted skills → "does resume explicitly mention the skill I need."
Composite = weighted blend (60/40) — showing both parts (not hiding math) = transparency, recruiter can see why score what it is, not black box.

TF-IDF fallback — what and why

sentence-transformers model need real RAM (~256MB) to load. Free-tier hosting (Render/Railway) sometime tight (512MB total).
If model fail load at startup (OOM) → app auto-switch to TF-IDF (simpler, classic keyword-frequency algorithm, much lighter RAM) — so scoring still work, just less "semantic-smart," clearly labeled which method used (scoring_method field) so it never silently degrade without you knowing.

Row-level auth (owner check)

Being logged in ≠ allowed to touch everything. Every Job/Candidate mutation check: does this resource actually belong to the logged-in recruiter? If not, 403 — even if attacker guess a valid job ID that isn't theirs, blocked.

Rate limiting

Login/reset endpoint capped ~5 attempts/15min per IP+account — block brute-force password guessing.

Audit log

Every score computed, every status change (shortlist/reject) — logged who/when. Immutable (no edit/delete on log itself) — proof of accountability, standard for recruiting tools (compliance-adjacent even for a demo project).


One-liner pitch you can say out loud:
"ResumeRank lets a recruiter post a job, upload resumes, and get each candidate ranked by a transparent two-part score — semantic fit plus exact skill match — computed by a deterministic ML pipeline, not an LLM, so it's fast, reliable, and explainable. The recruiter always makes the final call; the tool just surfaces signal, ranked and broken down."