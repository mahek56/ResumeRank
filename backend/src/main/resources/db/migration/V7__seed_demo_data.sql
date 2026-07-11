-- ============================================================
-- V7: Demo seed data
-- 1 user, 1 job with 4 skills, 6 candidates with scores.
-- Password hash below = BCrypt cost 12 of "Demo1234!"
-- Login: demo@resumerank.dev / Demo1234!
-- ============================================================

-- Demo user
INSERT INTO users (id, email, password_hash, email_verified)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'demo@resumerank.dev',
  '$2a$12$PqzlM8xJgPJ9f.RKbqeVqexqQblDrEQEgFMJq3Ix/rLk5rdFBiuva',
  TRUE
);

-- Demo job
INSERT INTO jobs (id, owner_id, title, description)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Senior Backend Engineer',
  'We are looking for a senior backend engineer with strong Java and Spring Boot experience. You will design and build scalable REST APIs, integrate with PostgreSQL databases, and collaborate with cross-functional teams. Experience with Docker and cloud deployments is a plus.'
);

-- Job skills
INSERT INTO skills (id, job_id, name, weight) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Java',         2.0),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Spring Boot',  2.0),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'PostgreSQL',   1.5),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'Docker',       1.0);

-- Candidates (resume_file_url points to a placeholder path; real uploads replace this)
INSERT INTO candidates (id, job_id, name, email, resume_file_url, experience_years, education, status) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'Alice Nguyen',  'alice@example.com',  'seed/alice_nguyen.pdf',  7, 'B.S. Computer Science',  'shortlisted'),
  ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001',
   'Ben Carter',    'ben@example.com',    'seed/ben_carter.pdf',    4, 'B.E. Software Engineering','pending'),
  ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001',
   'Priya Sharma',  'priya@example.com',  'seed/priya_sharma.pdf',  9, 'M.S. Computer Science',   'shortlisted'),
  ('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001',
   'Tom Ellison',   'tom@example.com',    'seed/tom_ellison.pdf',   2, 'B.S. Information Systems','pending'),
  ('d0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001',
   'Sara Lin',      'sara@example.com',   'seed/sara_lin.pdf',      6, 'B.S. Computer Science',   'pending'),
  ('d0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001',
   'Raj Patel',     'raj@example.com',    'seed/raj_patel.pdf',     1, 'B.E. Computer Engineering','rejected');

-- Scores (pre-computed, skipping real AI scoring for seed data)
INSERT INTO scores (id, candidate_id, composite_score, semantic_score, keyword_score, scoring_method, matched_skills, missing_skills) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   87.5, 89.0, 85.0, 'seed', '["Java","Spring Boot","PostgreSQL","Docker"]', '[]'),

  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002',
   64.0, 61.0, 68.0, 'seed', '["Java","Spring Boot"]', '["PostgreSQL","Docker"]'),

  ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003',
   91.2, 93.0, 88.0, 'seed', '["Java","Spring Boot","PostgreSQL","Docker"]', '[]'),

  ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004',
   38.0, 35.0, 42.0, 'seed', '["Java"]', '["Spring Boot","PostgreSQL","Docker"]'),

  ('e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000005',
   72.3, 70.0, 75.5, 'seed', '["Java","Spring Boot","PostgreSQL"]', '["Docker"]'),

  ('e0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000006',
   22.5, 20.0, 26.0, 'seed', '["Java"]', '["Spring Boot","PostgreSQL","Docker"]');

-- Candidate skills (matched skills per candidate)
INSERT INTO candidate_skills (id, candidate_id, name, matched) VALUES
  -- Alice
  ('f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Java',        TRUE),
  ('f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'Spring Boot', TRUE),
  ('f0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'PostgreSQL',  TRUE),
  ('f0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000001', 'Docker',      TRUE),
  -- Ben
  ('f0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002', 'Java',        TRUE),
  ('f0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000002', 'Spring Boot', TRUE),
  ('f0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000002', 'MySQL',       FALSE),
  -- Priya
  ('f0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000003', 'Java',        TRUE),
  ('f0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000003', 'Spring Boot', TRUE),
  ('f0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000003', 'PostgreSQL',  TRUE),
  ('f0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000003', 'Docker',      TRUE),
  ('f0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000003', 'Kubernetes',  FALSE),
  -- Tom
  ('f0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000004', 'Java',        TRUE),
  ('f0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000004', 'Python',      FALSE),
  -- Sara
  ('f0000000-0000-0000-0000-000000000015', 'd0000000-0000-0000-0000-000000000005', 'Java',        TRUE),
  ('f0000000-0000-0000-0000-000000000016', 'd0000000-0000-0000-0000-000000000005', 'Spring Boot', TRUE),
  ('f0000000-0000-0000-0000-000000000017', 'd0000000-0000-0000-0000-000000000005', 'PostgreSQL',  TRUE),
  -- Raj
  ('f0000000-0000-0000-0000-000000000018', 'd0000000-0000-0000-0000-000000000006', 'Java',        TRUE),
  ('f0000000-0000-0000-0000-000000000019', 'd0000000-0000-0000-0000-000000000006', 'Node.js',     FALSE);
