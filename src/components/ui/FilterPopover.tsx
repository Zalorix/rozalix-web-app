"use client";

import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * A "Filters" button with a popover panel. Keeps optional/secondary filters
 * off the main screen. The panel content is provided by the caller.
 */
export function FilterPopover({
  activeCount = 0,
  onClear,
  children,
}: {
  /** Number of active filters — shown as a badge; drives the highlight. */
  activeCount?: number;
  onClear?: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-[13px] font-medium transition-colors",
          activeCount || open
            ? "border-[var(--color-indigo)] bg-[var(--color-indigo-50)] text-[var(--color-indigo-deeper)]"
            : "border-[var(--color-slate-200)] text-[var(--color-slate-600)] hover:border-[var(--color-slate-300)]",
        )}
      >
        <SlidersHorizontal className="size-4" />
        Filters
        {activeCount > 0 && (
          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--color-indigo)] px-1.5 text-[11px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-[var(--radius-lg)] border border-[var(--color-slate-200)] bg-white p-4 shadow-[var(--shadow-lift)]">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-semibold">Filters</span>
            {onClear && (
              <button
                onClick={onClear}
                disabled={activeCount === 0}
                className="text-[12px] font-medium text-[var(--color-indigo)] hover:underline disabled:text-[var(--color-slate-300)] disabled:no-underline"
              >
                Clear all
              </button>
            )}
          </div>
          {children}
        </div>
      )}
    </div>
  );
}
