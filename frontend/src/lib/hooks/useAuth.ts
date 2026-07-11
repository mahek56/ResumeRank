"use client";

import { useState, useEffect, useCallback } from "react";
import { api, ApiClientError } from "../api";
import type { User, LoginRequest, RegisterRequest } from "../types";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Hydrate on mount — check cookie-authenticated session
  useEffect(() => {
    api.auth
      .me()
      .then((res) => {
        setState({ user: res.user, loading: false, error: null });
      })
      .catch(() => {
        setState({ user: null, loading: false, error: null });
      });
  }, []);

  const login = useCallback(
    async (body: LoginRequest): Promise<void> => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await api.auth.login(body);
        setState({ user: res.user, loading: false, error: null });
      } catch (err) {
        const msg =
          err instanceof ApiClientError ? err.message : "Login failed";
        setState((s) => ({ ...s, loading: false, error: msg }));
        throw err;
      }
    },
    []
  );

  const register = useCallback(
    async (body: RegisterRequest): Promise<void> => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await api.auth.register(body);
        setState({ user: res.user, loading: false, error: null });
      } catch (err) {
        const msg =
          err instanceof ApiClientError ? err.message : "Registration failed";
        setState((s) => ({ ...s, loading: false, error: msg }));
        throw err;
      }
    },
    []
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.auth.logout();
    } catch {
      // Swallow — redirect anyway
    }
    setState({ user: null, loading: false, error: null });
    window.location.href = "/login";
  }, []);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: state.user !== null,
    login,
    register,
    logout,
    clearError,
  };
}
