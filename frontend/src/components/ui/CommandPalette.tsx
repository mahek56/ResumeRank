"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { Command } from "cmdk";
import {
  Briefcase,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  Search,
  Users,
} from "lucide-react";
import { clsx } from "clsx";

// ---- Types ----

interface CommandItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
}

interface CommandGroup {
  heading: string;
  items: CommandItem[];
}

interface CommandPaletteProps {
  /** Called when the user navigates — typically router.push */
  onNavigate?: (path: string) => void;
  /** Called when the user triggers logout */
  onLogout?: () => void;
  /** Called when the user triggers "new job" */
  onNewJob?: () => void;
  /**
   * Optional external open trigger. Incrementing this number will open
   * the palette (e.g. from Header's search button click).
   * The component also responds to ⌘K / Ctrl+K independently.
   */
  openSignal?: number;
}

// ---- Component ----

export function CommandPalette({
  onNavigate,
  onLogout,
  onNewJob,
  openSignal,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const prevSignal = useRef<number | undefined>(undefined);

  // Open when external signal increments (from Header button)
  useEffect(() => {
    if (openSignal !== undefined && openSignal !== prevSignal.current) {
      prevSignal.current = openSignal;
      setOpen(true);
    }
  }, [openSignal]);

  // ⌘K / Ctrl+K toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const run = useCallback(
    (fn?: () => void) => {
      close();
      fn?.();
    },
    [close]
  );

  const groups: CommandGroup[] = [
    {
      heading: "Navigation",
      items: [
        {
          id: "nav-jobs",
          label: "Go to Jobs",
          icon: <Briefcase size={15} />,
          onSelect: () => run(() => onNavigate?.("/jobs")),
        },
        {
          id: "nav-dashboard",
          label: "Go to Dashboard",
          icon: <LayoutDashboard size={15} />,
          onSelect: () => run(() => onNavigate?.("/dashboard")),
        },
        {
          id: "nav-candidates",
          label: "View Candidates",
          icon: <Users size={15} />,
          onSelect: () => run(() => onNavigate?.("/jobs")),
        },
      ],
    },
    {
      heading: "Actions",
      items: [
        {
          id: "action-new-job",
          label: "New Job Posting",
          icon: <Plus size={15} />,
          shortcut: "N",
          onSelect: () => run(onNewJob),
        },
      ],
    },
    {
      heading: "Account",
      items: [
        {
          id: "account-settings",
          label: "Settings",
          icon: <Settings size={15} />,
          onSelect: () => run(() => onNavigate?.("/settings")),
        },
        {
          id: "account-logout",
          label: "Log out",
          icon: <LogOut size={15} />,
          onSelect: () => run(onLogout),
        },
      ],
    },
  ];

  if (!open) return null;

  return (
    /* Overlay */
    <div
      onClick={close}
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4"
      style={{ background: "oklch(0 0 0 / 0.6)", backdropFilter: "blur(4px)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      {/* Dialog — stop propagation so clicks inside don't close */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={clsx(
          "w-full max-w-xl overflow-hidden",
          "bg-[var(--color-bg-elevated)] rounded-[var(--radius-lg)]",
          "border border-[var(--color-border)]",
          "shadow-[var(--shadow-lg)]",
          "animate-[slideUp_150ms_ease-out]"
        )}
      >
        <Command
          label="Command palette"
          className="flex flex-col"
          shouldFilter={true}
        >
          {/* Search input */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]">
            <Search size={16} className="text-[var(--color-text-tertiary)] shrink-0" />
            <Command.Input
              autoFocus
              placeholder="Type a command or search…"
              className={clsx(
                "flex-1 bg-transparent border-none outline-none",
                "text-sm text-[var(--color-text-primary)]",
                "placeholder:text-[var(--color-text-tertiary)]"
              )}
            />
            <kbd
              className={clsx(
                "text-[10px] font-mono px-1.5 py-0.5 shrink-0",
                "rounded border border-[var(--color-border)]",
                "text-[var(--color-text-tertiary)]"
              )}
            >
              ESC
            </kbd>
          </div>

          {/* Results */}
          <Command.List className="overflow-y-auto max-h-[60vh] py-2">
            <Command.Empty className="px-4 py-8 text-center text-sm text-[var(--color-text-secondary)]">
              No results found.
            </Command.Empty>

            {groups.map((group) => (
              <Command.Group
                key={group.heading}
                heading={group.heading}
                className="mb-1"
              >
                <span
                  className="block px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]"
                  aria-hidden
                >
                  {group.heading}
                </span>
                {group.items.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.label}
                    onSelect={item.onSelect}
                    className={clsx(
                      "flex items-center gap-3 px-4 py-2.5 mx-1 rounded-[var(--radius-sm)]",
                      "text-sm text-[var(--color-text-secondary)] cursor-pointer",
                      "data-[selected=true]:bg-[var(--color-bg-hover)]",
                      "data-[selected=true]:text-[var(--color-text-primary)]",
                      "transition-colors duration-[var(--duration-micro)]"
                    )}
                  >
                    <span className="text-[var(--color-text-tertiary)]">
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {item.shortcut && (
                      <kbd
                        className={clsx(
                          "text-[10px] font-mono px-1.5 py-0.5",
                          "rounded border border-[var(--color-border)]",
                          "text-[var(--color-text-tertiary)]"
                        )}
                      >
                        {item.shortcut}
                      </kbd>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
