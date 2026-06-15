"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/** Prev / page-indicator / Next pager with a range readout. */
export function Pagination({
  page,
  totalPages,
  onPage,
  totalItems,
  pageSize,
  className,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
  totalItems?: number;
  pageSize?: number;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const range =
    totalItems != null && pageSize != null
      ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalItems)} of ${totalItems}`
      : `Page ${page} of ${totalPages}`;

  const btn =
    "flex size-8 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-slate-200)] text-[var(--color-slate-600)] transition-colors hover:border-[var(--color-slate-300)] hover:bg-[var(--color-slate-50)] disabled:pointer-events-none disabled:opacity-40";

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-t border-[var(--color-slate-100)] px-5 py-3",
        className,
      )}
    >
      <span className="text-[13px] text-[var(--color-slate-500)]">{range}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={btn}
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="min-w-14 text-center text-[13px] font-medium tabular-nums">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          className={btn}
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
