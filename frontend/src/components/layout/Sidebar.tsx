"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  LayoutDashboard,
  LogOut,
  ChevronRight,
  Zap,
} from "lucide-react";
import { clsx } from "clsx";
import type { User } from "@/lib/types";

// ---- Nav links config ----

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/jobs",
    label: "Jobs",
    icon: <Briefcase size={16} />,
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard size={16} />,
  },
];

// ---- Props ----

interface SidebarProps {
  user: User | null;
  onLogout?: () => void;
  collapsed?: boolean;
}

// ---- Component ----

export function Sidebar({ user, onLogout, collapsed = false }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Application navigation"
      className={clsx(
        "flex flex-col h-full",
        "bg-[var(--color-bg-secondary)]",
        "border-r border-[var(--color-border)]",
        "transition-[width] duration-[var(--duration-normal)]",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Wordmark / Logo */}
      <div
        className={clsx(
          "flex items-center gap-2.5 px-4 h-14 shrink-0",
          "border-b border-[var(--color-border)]"
        )}
      >
        <div
          className={clsx(
            "w-7 h-7 shrink-0 rounded-[var(--radius-sm)]",
            "bg-[var(--color-accent-500)] flex items-center justify-center",
            "shadow-[var(--shadow-glow)]"
          )}
          aria-hidden
        >
          <Zap size={14} className="text-white" />
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold tracking-tight text-[var(--color-text-primary)]">
            ResumeRank
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        <ul className="space-y-0.5" role="list">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-default)]",
                    "text-sm font-medium",
                    "transition-all duration-[var(--duration-micro)]",
                    active
                      ? "bg-[var(--color-accent-500)]/15 text-[var(--color-accent-400)]"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]",
                    collapsed && "justify-center px-2"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <span className={active ? "text-[var(--color-accent-400)]" : "text-[var(--color-text-tertiary)]"}>
                    {item.icon}
                  </span>
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && active && (
                    <ChevronRight size={12} className="ml-auto text-[var(--color-accent-400)]" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div
        className={clsx(
          "shrink-0 border-t border-[var(--color-border)] px-3 py-3",
          "flex items-center gap-3"
        )}
      >
        {/* Avatar */}
        <div
          aria-hidden
          className={clsx(
            "shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
            "bg-[var(--color-accent-700)] text-[var(--color-accent-200)]",
            "text-xs font-semibold uppercase"
          )}
        >
          {user?.name?.[0] ?? "?"}
        </div>

        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                {user?.name ?? "—"}
              </p>
              <p className="text-[10px] text-[var(--color-text-tertiary)] truncate">
                {user?.email ?? "—"}
              </p>
            </div>
            <button
              onClick={onLogout}
              aria-label="Log out"
              title="Log out"
              className={clsx(
                "shrink-0 p-1.5 rounded-[var(--radius-sm)]",
                "text-[var(--color-text-tertiary)]",
                "hover:text-[var(--color-error)] hover:bg-[var(--color-error-muted)]",
                "transition-colors duration-[var(--duration-micro)]"
              )}
            >
              <LogOut size={14} />
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
