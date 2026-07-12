// ============================================================
// ResumeRank — API fetch wrapper
//
// - Base URL from NEXT_PUBLIC_API_URL env (default: localhost:8080)
// - credentials: 'include' so the httpOnly JWT cookie is sent automatically
// - Auto-redirects to /login on 401
// - Typed response parsing with ApiError on non-2xx
// ============================================================

import type { ApiError } from "./types";

const getBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl !== "undefined" && envUrl !== "") {
    return envUrl.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    return "";
  }
  return "http://localhost:8080";
};

const BASE_URL = getBaseUrl();

class ApiClientError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    // Only redirect on the client side if not already on the login page
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    throw new ApiClientError("Unauthorized", 401);
  }

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const err: ApiError = await res.json();
      message = err.message ?? message;
    } catch {
      // body wasn't JSON — use default message
    }
    throw new ApiClientError(message, res.status);
  }

  // 204 No Content — return empty
  if (res.status === 204) {
    return undefined as unknown as T;
  }

  return res.json() as Promise<T>;
}

// ---- Core request helpers ----

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse<T>(res);
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

async function postForm<T>(path: string, formData: FormData): Promise<T> {
  // Don't set Content-Type — browser sets it with the correct boundary for multipart
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  return handleResponse<T>(res);
}

async function patch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse<T>(res);
}

// ---- Auth ----

import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Job,
  JobRequest,
  Skill,
  SkillRequest,
  Candidate,
  CandidateFilters,
  CandidateStatus,
  PageResponse,
  DashboardData,
} from "./types";

export const api = {
  auth: {
    login: (body: LoginRequest) =>
      post<AuthResponse>("/api/auth/login", body),

    register: (body: RegisterRequest) =>
      post<AuthResponse>("/api/auth/register", body),

    logout: () => post<void>("/api/auth/logout"),

    me: () => get<AuthResponse>("/api/auth/me"),
  },

  jobs: {
    list: (page = 0, size = 25) =>
      get<PageResponse<Job>>(`/api/jobs?page=${page}&size=${size}`),

    get: (id: string) => get<Job>(`/api/jobs/${id}`),

    create: (body: JobRequest) => post<Job>("/api/jobs", body),

    update: (id: string, body: JobRequest) =>
      patch<Job>(`/api/jobs/${id}`, body),

    delete: (id: string) => del<void>(`/api/jobs/${id}`),

    addSkill: (jobId: string, body: SkillRequest) =>
      post<Skill>(`/api/jobs/${jobId}/skills`, body),

    deleteSkill: (jobId: string, skillId: string) =>
      del<void>(`/api/jobs/${jobId}/skills/${skillId}`),
  },

  candidates: {
    upload: (formData: FormData) =>
      postForm<Candidate>("/api/candidates", formData),

    list: (filters: CandidateFilters) => {
      const params = new URLSearchParams();
      params.set("jobId", filters.jobId);
      if (filters.search) params.set("search", filters.search);
      if (filters.status) params.set("status", filters.status);
      if (filters.sort) params.set("sort", filters.sort);
      if (filters.dir) params.set("dir", filters.dir);
      if (filters.page !== undefined) params.set("page", String(filters.page));
      if (filters.size !== undefined) params.set("size", String(filters.size));
      return get<PageResponse<Candidate>>(`/api/candidates?${params}`);
    },

    get: (id: string) => get<Candidate>(`/api/candidates/${id}`),

    updateStatus: (id: string, status: CandidateStatus) =>
      patch<Candidate>(`/api/candidates/${id}/status`, { status }),

    bulkUpdateStatus: (ids: string[], status: CandidateStatus) =>
      patch<Candidate[]>("/api/candidates/bulk-status", {
        candidateIds: ids,
        status,
      }),

    exportUrl: (jobId: string, status?: CandidateStatus) => {
      const params = new URLSearchParams({ jobId });
      if (status) params.set("status", status);
      return `${BASE_URL}/api/candidates/export?${params}`;
    },
  },

  dashboard: {
    get: (jobId: string) =>
      get<DashboardData>(`/api/jobs/${jobId}/dashboard`),
  },
} as const;

export { ApiClientError };
