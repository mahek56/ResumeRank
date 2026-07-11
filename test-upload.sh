#!/usr/bin/env bash
# =============================================================================
# ResumeRank — E2E upload test script
# Run AFTER: postgres is up, ai-service is running on :8000, backend on :8080
#
# Usage:
#   bash test-upload.sh
# =============================================================================
set -e

BASE="http://localhost:8080"
AI_BASE="http://localhost:8000"

echo "=== Step 0: Health checks ==="
curl -sf "$AI_BASE/health" | python3 -m json.tool
curl -sf "$BASE/actuator/health" 2>/dev/null || echo "(Spring Boot has no actuator — expected)"

echo ""
echo "=== Step 1: Register a recruiter ==="
REGISTER=$(curl -sf -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"recruiter@test.com","password":"Password123!","name":"Test Recruiter"}')
echo "$REGISTER" | python3 -m json.tool

echo ""
echo "=== Step 2: Login and capture cookie ==="
# Capture Set-Cookie header
LOGIN=$(curl -sf -c /tmp/rr_cookies.txt -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"recruiter@test.com","password":"Password123!"}')
echo "$LOGIN" | python3 -m json.tool

echo ""
echo "=== Step 3: Create a job ==="
JOB=$(curl -sf -b /tmp/rr_cookies.txt -X POST "$BASE/api/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior Python Engineer",
    "description": "We need a Python engineer with 5+ years of experience in FastAPI, PostgreSQL, Docker, and machine learning. Strong skills in NLP and data pipelines required."
  }')
echo "$JOB" | python3 -m json.tool
JOB_ID=$(echo "$JOB" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Job ID: $JOB_ID"

echo ""
echo "=== Step 4: Add skills to job ==="
curl -sf -b /tmp/rr_cookies.txt -X POST "$BASE/api/jobs/$JOB_ID/skills" \
  -H "Content-Type: application/json" \
  -d '{"name":"Python","weight":2.0}' | python3 -m json.tool
curl -sf -b /tmp/rr_cookies.txt -X POST "$BASE/api/jobs/$JOB_ID/skills" \
  -H "Content-Type: application/json" \
  -d '{"name":"FastAPI","weight":1.5}' | python3 -m json.tool
curl -sf -b /tmp/rr_cookies.txt -X POST "$BASE/api/jobs/$JOB_ID/skills" \
  -H "Content-Type: application/json" \
  -d '{"name":"PostgreSQL","weight":1.0}' | python3 -m json.tool
curl -sf -b /tmp/rr_cookies.txt -X POST "$BASE/api/jobs/$JOB_ID/skills" \
  -H "Content-Type: application/json" \
  -d '{"name":"Docker","weight":1.0}' | python3 -m json.tool

echo ""
echo "=== Step 5: Upload sample PDF resume ==="
UPLOAD=$(curl -sf -b /tmp/rr_cookies.txt -X POST "$BASE/api/candidates" \
  -F "file=@sample_resume.pdf;type=application/pdf" \
  -F "jobId=$JOB_ID" \
  -F "name=Jane Doe" \
  -F "email=jane.doe@example.com")
echo "$UPLOAD" | python3 -m json.tool

CANDIDATE_ID=$(echo "$UPLOAD" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Candidate ID: $CANDIDATE_ID"

echo ""
echo "=== Step 6: Verify candidate list ==="
curl -sf -b /tmp/rr_cookies.txt \
  "$BASE/api/candidates?jobId=$JOB_ID&sort=composite_score&dir=desc" \
  | python3 -m json.tool

echo ""
echo "=== Step 7: Dashboard ==="
curl -sf -b /tmp/rr_cookies.txt "$BASE/api/jobs/$JOB_ID/dashboard" \
  | python3 -m json.tool

echo ""
echo "=== Step 8: Update status ==="
curl -sf -b /tmp/rr_cookies.txt -X PATCH "$BASE/api/candidates/$CANDIDATE_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"shortlisted"}' | python3 -m json.tool

echo ""
echo "=== Step 9: CSV export ==="
curl -sf -b /tmp/rr_cookies.txt \
  "$BASE/api/candidates/export?jobId=$JOB_ID"

echo ""
echo "=== E2E Test COMPLETE ==="
