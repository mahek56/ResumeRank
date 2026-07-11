"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { ToastProvider } from "@/components/ui/Toast";
import { useAuth } from "@/lib/hooks/useAuth";

/**
 * Dashboard layout — authenticated shell.
 * Wraps all protected routes with:
 *  - Sidebar (left, 240px)
 *  - Header (top, sticky)
 *  - Main content area (right, scrollable)
 *  - CommandPalette (global ⌘K, always mounted)
 *  - ToastProvider (global toast stack)
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, logout } = useAuth();

  /**
   * openSignal — increment to tell CommandPalette to open.
   * The palette manages its own open/closed state; this is just
   * an external trigger (e.g. from the Header search button).
   */
  const [openSignal, setOpenSignal] = useState(0);
  const triggerPalette = useCallback(() => setOpenSignal((n) => n + 1), []);

  const handleNavigate = useCallback(
    (path: string) => router.push(path),
    [router]
  );

  const handleNewJob = useCallback(
    () => router.push("/jobs/new"),
    [router]
  );

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-[var(--color-bg-primary)]">
        {/* Sidebar */}
        <Sidebar user={user} onLogout={logout} />

        {/* Main column: header + scrollable content */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Header onOpenCommandPalette={triggerPalette} />

          <main
            id="main-content"
            className="flex-1 overflow-y-auto"
            tabIndex={-1}
          >
            <div className="max-w-7xl mx-auto px-6 py-6">{children}</div>
          </main>
        </div>

        {/* Global CommandPalette — always mounted, opens on ⌘K or signal */}
        <CommandPalette
          openSignal={openSignal}
          onNavigate={handleNavigate}
          onLogout={logout}
          onNewJob={handleNewJob}
        />
      </div>
    </ToastProvider>
  );
}
