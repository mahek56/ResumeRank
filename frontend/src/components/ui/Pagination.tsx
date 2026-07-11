import { clsx } from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Select } from "./Select";

interface PaginationProps {
  page: number;           // 0-indexed
  totalPages: number;
  totalElements: number;
  size: number;
  onPageChange: (page: number) => void;
  onSizeChange?: (size: number) => void;
  className?: string;
}

const SIZE_OPTIONS = [
  { value: "25", label: "25 / page" },
  { value: "50", label: "50 / page" },
  { value: "100", label: "100 / page" },
];

export function Pagination({
  page,
  totalPages,
  totalElements,
  size,
  onPageChange,
  onSizeChange,
  className,
}: PaginationProps) {
  const from = totalElements === 0 ? 0 : page * size + 1;
  const to = Math.min((page + 1) * size, totalElements);

  const pages = buildPageList(page, totalPages);

  return (
    <div className={clsx("flex items-center justify-between gap-4 flex-wrap", className)}>
      {/* Count */}
      <p className="text-sm text-[var(--color-text-secondary)] shrink-0">
        {totalElements === 0
          ? "No results"
          : `${from}–${to} of ${totalElements}`}
      </p>

      {/* Page buttons */}
      <div className="flex items-center gap-1">
        <PageBtn
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </PageBtn>

        {pages.map((p, i) =>
          p === "..." ? (
            <span
              key={`ellipsis-${i}`}
              className="w-8 text-center text-[var(--color-text-tertiary)] text-sm"
            >
              …
            </span>
          ) : (
            <PageBtn
              key={p}
              onClick={() => onPageChange(p as number)}
              active={p === page}
            >
              {(p as number) + 1}
            </PageBtn>
          )
        )}

        <PageBtn
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </PageBtn>
      </div>

      {/* Size selector */}
      {onSizeChange && (
        <Select
          options={SIZE_OPTIONS}
          value={String(size)}
          onChange={(e) => onSizeChange(Number(e.target.value))}
          className="w-32"
          aria-label="Page size"
        />
      )}
    </div>
  );
}

// ---- Helpers ----

function buildPageList(
  current: number,
  total: number
): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  if (current < 4) return [0, 1, 2, 3, 4, "...", total - 1];
  if (current > total - 5)
    return [0, "...", total - 5, total - 4, total - 3, total - 2, total - 1];
  return [0, "...", current - 1, current, current + 1, "...", total - 1];
}

interface PageBtnProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  "aria-label"?: string;
}

function PageBtn({ children, onClick, disabled, active, ...props }: PageBtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      {...props}
      className={clsx(
        "w-8 h-8 flex items-center justify-center text-sm rounded-[var(--radius-sm)]",
        "transition-colors duration-[var(--duration-micro)]",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        active
          ? "bg-[var(--color-accent-500)] text-white"
          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
      )}
    >
      {children}
    </button>
  );
}
