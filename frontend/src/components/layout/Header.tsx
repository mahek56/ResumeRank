"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search, ChevronRight, Home } from "lucide-react";
import { clsx } from "clsx";

// ---- Breadcrumb helpers ----

/**
 * Converts a URL pathname into human-readable breadcrumb segments.
 * /jobs/abc-123/candidates → ["Jobs", "abc-123", "Candidates"]
 */
function pathToBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split("/").filter(Boolean);
  let accum = "";
  return segments.map((seg) => {
    accum += `/${seg}`;
    // Capitalize first letter, treat UUIDs as-is
    const isUuid = /^[0-9a-f-]{8,}$/i.test(seg);
    const label = isUuid ? seg.slice(0, 8) + "…" : seg.charAt(0).toUpperCase() + seg.slice(1);
    return { label, href: accum };
  });
}

// ---- Props ----

interface HeaderProps {
  /** Custom page title override (if omitted, derived from pathname) */
  title?: string;
  /** Called when the search / command-palette trigger is pressed */
  onOpenCommandPalette?: () => void;
}

// ---- Component ----

export function Header({ title, onOpenCommandPalette }: HeaderProps) {
  const pathname = usePathname();
  const crumbs = pathToBreadcrumbs(pathname);

  return (
    <header
      className={clsx(
        "h-14 shrink-0 flex items-center justify-between gap-4",
        "px-6 border-b border-[var(--color-border)]",
        "bg-[var(--color-bg-primary)]/80 backdrop-blur-sm",
        "sticky top-0 z-10"
      )}
    >
      {/* Left — breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0">
        <Link
          href="/jobs"
          aria-label="Home"
          className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <Home size={13} />
        </Link>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={crumb.href} className="flex items-center gap-1.5 min-w-0">
              <ChevronRight size={12} className="text-[var(--color-text-tertiary)] shrink-0" />
              {isLast ? (
                <span
                  aria-current="page"
                  className="text-xs font-medium text-[var(--color-text-primary)] truncate max-w-[180px]"
                >
                  {title ?? crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors truncate max-w-[120px]"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      {/* Right — command palette trigger */}
      <button
        id="command-palette-trigger"
        onClick={onOpenCommandPalette}
        aria-label="Open command palette (⌘K)"
        className={clsx(
          "flex items-center gap-2 pl-3 pr-2 h-7",
          "rounded-[var(--radius-default)]",
          "bg-[var(--color-bg-elevated)] border border-[var(--color-border)]",
          "text-xs text-[var(--color-text-tertiary)]",
          "hover:border-[var(--color-border-focus)] hover:text-[var(--color-text-secondary)]",
          "transition-all duration-[var(--duration-micro)] cursor-pointer"
        )}
      >
        <Search size={12} />
        <span className="hidden sm:block">Search…</span>
        <kbd
          className={clsx(
            "hidden sm:flex items-center gap-0.5",
            "text-[9px] font-mono px-1 py-0.5 ml-2",
            "rounded border border-[var(--color-border)]",
            "text-[var(--color-text-tertiary)]"
          )}
        >
          <span>⌘</span>
          <span>K</span>
        </kbd>
      </button>
    </header>
  );
}
