import type { Metadata } from "next";
import { Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "ResumeRank — Sign in",
  description: "Sign in or create your ResumeRank account.",
};

/**
 * Auth layout — centered card on the brand gradient background.
 * No sidebar / header — clean focus on auth forms.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient gradient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full"
        style={{
          background:
            "radial-gradient(circle, oklch(0.585 0.19 270 / 0.12) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-32 w-[28rem] h-[28rem] rounded-full"
        style={{
          background:
            "radial-gradient(circle, oklch(0.65 0.18 145 / 0.07) 0%, transparent 70%)",
        }}
      />

      {/* Logo mark */}
      <div className="flex items-center gap-2.5 mb-8">
        <div
          className="w-8 h-8 rounded-[var(--radius-default)] flex items-center justify-center"
          style={{
            background: "var(--color-accent-500)",
            boxShadow: "var(--shadow-glow)",
          }}
        >
          <Zap size={16} className="text-white" />
        </div>
        <span className="text-base font-semibold tracking-tight text-[var(--color-text-primary)]">
          ResumeRank
        </span>
      </div>

      {/* Auth card */}
      <div
        className="w-full max-w-sm"
        style={{
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {children}
      </div>

      {/* Footer */}
      <p className="mt-6 text-[11px] text-[var(--color-text-tertiary)] text-center">
        &copy; {new Date().getFullYear()} ResumeRank. All rights reserved.
      </p>
    </div>
  );
}
