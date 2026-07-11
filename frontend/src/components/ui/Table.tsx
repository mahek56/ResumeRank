import { clsx } from "clsx";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

// ---- Column definition ----

export interface TableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  render: (row: T) => ReactNode;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;
}

export function Table<T>({
  columns,
  rows,
  getRowKey,
  sortKey,
  sortDir,
  onSort,
  onRowClick,
  emptyMessage = "No results",
  className,
}: TableProps<T>) {
  return (
    <div className={clsx("overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)]", className)}>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={clsx(
                  "px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider",
                  col.width,
                  col.sortable && onSort && "cursor-pointer select-none hover:text-[var(--color-text-primary)]"
                )}
                onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <span className="inline-flex flex-col">
                      <ChevronUp
                        size={10}
                        className={sortKey === col.key && sortDir === "asc"
                          ? "text-[var(--color-accent-400)]"
                          : "text-[var(--color-text-tertiary)]"}
                      />
                      <ChevronDown
                        size={10}
                        className={sortKey === col.key && sortDir === "desc"
                          ? "text-[var(--color-accent-400)]"
                          : "text-[var(--color-text-tertiary)]"}
                      />
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-[var(--color-text-tertiary)]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={getRowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={clsx(
                  "border-b border-[var(--color-border)] last:border-0",
                  "bg-[var(--color-bg-elevated)] transition-colors duration-[var(--duration-micro)]",
                  onRowClick && "cursor-pointer hover:bg-[var(--color-bg-hover)]"
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-[var(--color-text-primary)]">
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
