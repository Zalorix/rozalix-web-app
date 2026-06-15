"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Inbox } from "lucide-react";
import type { Lead, LeadStatus } from "@/lib/types";
import { LEAD_STATUSES } from "@/lib/types";
import { useWorkspace } from "@/lib/client-context";
import { listLeads } from "@/lib/store";
import { fullName, initials, timeAgo, formatFieldValue } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Input, Select } from "@/components/ui/Field";
import { LeadStatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState, Spinner } from "@/components/ui/EmptyState";
import { LeadDrawer } from "@/components/dashboard/LeadDrawer";

type Filter = "all" | LeadStatus;

const filterLabel: Record<Filter, string> = {
  all: "All",
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  won: "Won",
  lost: "Lost",
};

export default function LeadsPage() {
  const { client } = useWorkspace();
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Filter>("all");
  const [fieldFilters, setFieldFilters] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Columns + filters are derived entirely from the active client's schema.
  const tableFields = client?.formSchema.filter((f) => f.inTable) ?? [];
  const filterFields =
    client?.formSchema.filter((f) => f.filterable && f.options) ?? [];

  const refresh = useMemo(
    () => () => {
      if (client) listLeads(client.id).then(setLeads);
    },
    [client],
  );

  // Reset transient UI when switching accounts (schemas differ).
  useEffect(() => {
    setLeads(null);
    setQuery("");
    setStatus("all");
    setFieldFilters({});
    setSelectedId(null);
    refresh();
  }, [client?.id, refresh]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: leads?.length ?? 0,
      new: 0,
      contacted: 0,
      qualified: 0,
      won: 0,
      lost: 0,
    };
    leads?.forEach((l) => (c[l.status] += 1));
    return c;
  }, [leads]);

  const visible = useMemo(() => {
    if (!leads) return [];
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      if (status !== "all" && l.status !== status) return false;
      for (const [key, val] of Object.entries(fieldFilters)) {
        if (val && String(l.fields[key] ?? "") !== val) return false;
      }
      if (!q) return true;
      const haystack = [
        l.firstName,
        l.lastName,
        l.email,
        l.message,
        ...Object.values(l.fields).map(String),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [leads, query, status, fieldFilters]);

  const selected = leads?.find((l) => l.id === selectedId) ?? null;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Leads</h2>
        <p className="mt-1 text-sm text-[var(--color-slate-500)]">
          Enquiries submitted through {client?.name ?? "your"}&apos;s contact
          form.
        </p>
      </div>

      {/* Status filter + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {(["all", ...LEAD_STATUSES] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setStatus(f)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-3 py-1.5 text-[13px] font-medium transition-colors",
                status === f
                  ? "border-[var(--color-indigo)] bg-[var(--color-indigo-50)] text-[var(--color-indigo-deeper)]"
                  : "border-[var(--color-slate-200)] text-[var(--color-slate-600)] hover:border-[var(--color-slate-300)]",
              )}
            >
              {filterLabel[f]}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] font-semibold",
                  status === f
                    ? "bg-white/70 text-[var(--color-indigo-deeper)]"
                    : "bg-[var(--color-slate-100)] text-[var(--color-slate-500)]",
                )}
              >
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--color-slate-400)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads…"
            className="pl-9"
          />
        </div>
      </div>

      {/* Schema-driven field filters */}
      {filterFields.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filterFields.map((f) => (
            <Select
              key={f.key}
              value={fieldFilters[f.key] ?? ""}
              onChange={(e) =>
                setFieldFilters((prev) => ({ ...prev, [f.key]: e.target.value }))
              }
              className="h-9 w-auto py-1.5 text-[13px]"
            >
              <option value="">All {f.label.toLowerCase()}</option>
              {f.options!.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
          ))}
        </div>
      )}

      {/* Table */}
      <Card className="overflow-hidden">
        {leads === null ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<Inbox className="size-6" />}
            title="No leads found"
            description={
              query || status !== "all" || Object.values(fieldFilters).some(Boolean)
                ? "Try clearing your search or filters."
                : "New contact-form submissions will appear here."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-slate-100)] text-left text-[12px] font-semibold tracking-wide text-[var(--color-slate-400)] uppercase">
                  <th className="px-5 py-3 font-semibold">Name</th>
                  {tableFields.map((f) => (
                    <th
                      key={f.key}
                      className="hidden px-5 py-3 font-semibold md:table-cell"
                    >
                      {f.label}
                    </th>
                  ))}
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">
                    Received
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => setSelectedId(l.id)}
                    className="cursor-pointer border-b border-[var(--color-slate-100)] last:border-0 transition-colors hover:bg-[var(--color-slate-50)]"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar
                          size="sm"
                          initials={initials(l.firstName, l.lastName)}
                          accent={client?.accent}
                        />
                        <div className="min-w-0">
                          <div className="truncate font-medium">
                            {fullName(l.firstName, l.lastName)}
                          </div>
                          <div className="truncate text-[12px] text-[var(--color-slate-400)]">
                            {l.email || l.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    {tableFields.map((f) => (
                      <td
                        key={f.key}
                        className="hidden px-5 py-3.5 text-[var(--color-slate-600)] md:table-cell"
                      >
                        {formatFieldValue(l.fields[f.key], f.type)}
                      </td>
                    ))}
                    <td className="px-5 py-3.5">
                      <LeadStatusBadge status={l.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap text-[13px] text-[var(--color-slate-400)]">
                      {timeAgo(l.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <LeadDrawer
        lead={selected}
        onClose={() => setSelectedId(null)}
        onChanged={refresh}
      />
    </div>
  );
}
