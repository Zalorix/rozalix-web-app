import { cn } from "@/lib/cn";
import type { LeadStatus, ContentStatus } from "@/lib/types";

const leadStyles: Record<LeadStatus, string> = {
  new: "bg-[var(--color-indigo-50)] text-[var(--color-indigo-deeper)]",
  contacted: "bg-[var(--color-warning-soft)] text-[#B45309]",
  qualified: "bg-[#EFF6FF] text-[#1D4ED8]",
  won: "bg-[var(--color-success-soft)] text-[#047857]",
  lost: "bg-[var(--color-slate-100)] text-[var(--color-slate-500)]",
};

const leadLabel: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  won: "Won",
  lost: "Lost",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1 text-[12px] font-semibold",
        leadStyles[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {leadLabel[status]}
    </span>
  );
}

export function ContentStatusBadge({ status }: { status: ContentStatus }) {
  const published = status === "published";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1 text-[12px] font-semibold",
        published
          ? "bg-[var(--color-success-soft)] text-[#047857]"
          : "bg-[var(--color-slate-100)] text-[var(--color-slate-500)]",
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {published ? "Published" : "Draft"}
    </span>
  );
}
