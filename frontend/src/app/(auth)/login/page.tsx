"use client";

import { Suspense, useState, useId } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function LoginForm() {
  const id = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loading, error, clearError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const nextPath = searchParams.get("next") ?? "/jobs";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login({ email, password });
      router.replace(nextPath);
    } catch (err) {
      console.error("Login form submission failed:", err);
      // error displayed via state
    }
  };

  return (
    <div className="px-6 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Welcome back
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Sign in to your ResumeRank account.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className={clsx(
            "mb-5 px-4 py-3 rounded-[var(--radius-default)]",
            "bg-[var(--color-error-muted)] border border-[var(--color-error)]/30",
            "text-sm text-[var(--color-error)]"
          )}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`${id}-email`}
            className="text-xs font-medium text-[var(--color-text-secondary)]"
          >
            Email address
          </label>
          <Input
            id={`${id}-email`}
            type="email"
            autoComplete="email"
            required
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`${id}-password`}
            className="text-xs font-medium text-[var(--color-text-secondary)]"
          >
            Password
          </label>
          <div className="relative">
            <Input
              id={`${id}-password`}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              className={clsx(
                "absolute right-3 top-1/2 -translate-y-1/2",
                "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]",
                "transition-colors duration-[var(--duration-micro)]"
              )}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          fullWidth
          loading={loading}
          disabled={!email || !password}
          className="mt-2"
        >
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-[var(--color-text-tertiary)]">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-[var(--color-accent-400)] hover:underline font-medium"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="px-6 py-8 text-sm text-[var(--color-text-tertiary)]">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}