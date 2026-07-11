// ============================================================
// ResumeRank — TypeScript interfaces matching all backend DTOs
// ============================================================

// ---- Auth ----

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  // JWT is in httpOnly cookie — no token field in body
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// ---- Jobs ----

export interface Skill {
  id: string;
  name: string;
  weight: number;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  skills: Skill[];
  createdAt: string;
  updatedAt: string;
}

export interface JobRequest {
  title: string;
  description: string;
}

export interface SkillRequest {
  name: string;
  weight: number;
}

// ---- Candidates ----

export type CandidateStatus = "pending" | "shortlisted" | "rejected";

export interface Candidate {
  id: string;
  jobId: string;
  name: string;
  email: string | null;
  resumeFileUrl: string;
  experienceYears: number | null;
  education: string | null;
  status: CandidateStatus;
  createdAt: string;
  // Score inline (null if not yet scored)
  compositeScore: number | null;
  semanticScore: number | null;
  keywordScore: number | null;
  scoringMethod: string | null;
  matchedSkills: string[] | null;
  missingSkills: string[] | null;
}

// ---- Pagination ----

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// ---- Dashboard ----

export interface ScoreDistribution {
  band0to20: number;
  band20to40: number;
  band40to60: number;
  band60to80: number;
  band80to100: number;
}

export interface ScoreRange {
  min: number;
  max: number;
  median: number;
}

export interface StatusFunnel {
  pending: number;
  shortlisted: number;
  rejected: number;
}

export interface MissingSkillEntry {
  skill: string;
  count: number;
}

export interface DashboardData {
  totalCandidates: number;
  avgScore: number;
  scoreDistribution: ScoreDistribution;
  scoreRange: ScoreRange;
  statusFunnel: StatusFunnel;
  topMissingSkills: MissingSkillEntry[];
}

// ---- API errors ----

export interface ApiError {
  status: number;
  message: string;
  timestamp?: string;
}

// ---- Filters / Query params ----

export type SortField = "composite_score" | "name" | "created_at";
export type SortDir = "asc" | "desc";

export interface CandidateFilters {
  jobId: string;
  search?: string;
  status?: CandidateStatus;
  sort?: SortField;
  dir?: SortDir;
  page?: number;
  size?: number;
}
