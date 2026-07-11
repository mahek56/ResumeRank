"use client";

import { useState, useId } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// ---- Simple inline password strength ----

function passwordStrength(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["", "Weak", "Fair", "Good", "Strong", "Very strong"];
  return { score, label: labels[score] ?? "" };
}

const strengthColors = [
  "",
  "bg-[var(--color-error)]",
  "bg-[var(--color-warning)]",
  "bg-[var(--color-warning)]",
  "bg-[var(--color-success)]",
  "bg-[var(--color-success)]",
];

export default function RegisterPage() {
  const id = useId();
  const router = useRouter();
  const { register, loading, error, clearError } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = passwordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await register({ name, email, password });
      setSuccess(true);
      // Short delay so the user sees the success state before redirect
      setTimeout(() => router.replace("/jobs"), 1200);
    } catch {
      // error displayed via state
    }
  };

  const isValid = name.trim().length >= 2 && email.includes("@") && password.length >= 8;

  return (
    <div className="px-6 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Create your account
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Start ranking resumes in minutes.
        </p>
      </div>

      {/* Success state */}
      {success && (
        <div
          role="status"
          className={clsx(
            "mb-5 px-4 py-3 rounded-[var(--radius-default)]",
            "bg-[var(--color-success-muted)] border border-[var(--color-success)]/30",
            "flex items-center gap-2 text-sm text-[var(--color-success)]"
          )}
        >
          <CheckCircle2 size={16} />
          <span>Account created! Redirecting…</span>
        </div>
      )}

      {/* Error banner */}
      {error && !success && (
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
        {/* Full name */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`${id}-name`}
            className="text-xs font-medium text-[var(--color-text-secondary)]"
          >
            Full name
          </label>
          <Input
            id={`${id}-name`}
            type="text"
            autoComplete="name"
            required
            placeholder="Jane Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

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

        {/* Password + strength meter */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`${id}-password`}
            className="text-xs font-medium text-[var(--color-text-secondary)]"
          >
            Password
            <span className="text-[var(--color-text-tertiary)] font-normal ml-1">
              (min. 8 chars)
            </span>
          </label>
          <div className="relative">
            <Input
              id={`${id}-password`}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
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

          {/* Strength bar */}
          {password.length > 0 && (
            <div aria-live="polite" className="space-y-1">
              <div className="flex gap-1 h-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={clsx(
                      "flex-1 rounded-full transition-all duration-[var(--duration-normal)]",
                      i < strength.score
                        ? strengthColors[strength.score]
                        : "bg-[var(--color-border)]"
                    )}
                  />
                ))}
              </div>
              {strength.label && (
                <p className="text-[10px] text-[var(--color-text-tertiary)]">
                  Password strength:{" "}
                  <span className="font-medium text-[var(--color-text-secondary)]">
                    {strength.label}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          fullWidth
          loading={loading}
          disabled={!isValid || success}
          className="mt-2"
        >
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-[var(--color-text-tertiary)]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[var(--color-accent-400)] hover:underline font-medium"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
