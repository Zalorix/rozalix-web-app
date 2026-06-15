"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Inbox,
  Zap,
  MessageSquare,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import type { Lead, LeadStatus, FieldDef } from "@/lib/types";
import { LEAD_STATUSES } from "@/lib/types";
import type { Conversation } from "@/lib/assistant-types";
import { useWorkspace } from "@/lib/client-context";
import { listLeads } from "@/lib/store";
import { listConversations } from "@/lib/assistant-store";
import { quickScore } from "@/lib/ai";
import { fullName, initials, timeAgo, formatFieldValue } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Input, Select, Label } from "@/components/ui/Field";
import { LeadStatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState, Spinner } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { FilterPopover } from "@/components/ui/FilterPopover";
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

export default function LeadsRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      }
    >
      <LeadsPage />
    </Suspense>
  );
}

/** Phone → has-a-live-thread flag, aggregated across all conversations. */
type ChatFlag = { open: boolean; needsYou: boolean };

function LeadsPage() {
  const { client } = useWorkspace();
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [chatByPhone, setChatByPhone] = useState<Map<string, ChatFlag>>(
    new Map(),
  );
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Filter>("all");
  const [fieldFilters, setFieldFilters] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Default sort mirrors the store's order: newest first.
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({
    key: "received",
    dir: "desc",
  });

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

  // Aggregate live-chat presence per phone (lead → many conversations), polled.
  useEffect(() => {
    if (!client) return;
    let active = true;
    const load = async () => {
      const convos = await listConversations(client.id);
      if (!active) return;
      const map = new Map<string, ChatFlag>();
      convos.forEach((c: Conversation) => {
        if (!c.customerPhone) return;
        const open = c.status === "active" || c.status === "escalated";
        const needsYou = c.status === "escalated";
        const prev = map.get(c.customerPhone);
        map.set(c.customerPhone, {
          open: open || !!prev?.open,
          needsYou: needsYou || !!prev?.needsYou,
        });
      });
      setChatByPhone(map);
    };
    load();
    const id = setInterval(load, 3000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [client]);

  // Deep-link: /leads?lead=<id> opens that lead's drawer.
  useEffect(() => {
    if (!leads) return;
    const fromUrl = searchParams.get("lead");
    if (fromUrl && !selectedId && leads.some((l) => l.id === fromUrl)) {
      setSelectedId(fromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, searchParams]);

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

  const schema = useMemo(() => client?.formSchema ?? [], [client]);

  const visible = useMemo(() => {
    if (!leads) return [];
    const q = query.trim().toLowerCase();
    const filtered = leads.filter((l) => {
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

    const dir = sort.dir === "asc" ? 1 : -1;
    return filtered.sort((a, b) => {
      const av = sortValue(a, sort.key, schema);
      const bv = sortValue(b, sort.key, schema);
      // Missing values always sort last, regardless of direction.
      if (av.missing && bv.missing) return 0;
      if (av.missing) return 1;
      if (bv.missing) return -1;
      if (av.value < bv.value) return -1 * dir;
      if (av.value > bv.value) return 1 * dir;
      return 0;
    });
  }, [leads, query, status, fieldFilters, sort, schema]);

  function toggleSort(key: string) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "received" ? "desc" : "asc" },
    );
  }

  // Active filters (everything except the pipeline-status quick filters).
  const activeFilters =
    (query.trim() ? 1 : 0) +
    Object.values(fieldFilters).filter(Boolean).length;

  function clearFilters() {
    setQuery("");
    setFieldFilters({});
  }

  // Pagination
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  // Reset to page 1 when the result set or page size changes shape.
  useEffect(() => {
    setPage(1);
  }, [query, status, fieldFilters, sort, client?.id, pageSize]);
  // Clamp if the list shrank (e.g. a poll removed rows).
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const pageItems = visible.slice((page - 1) * pageSize, page * pageSize);

  const selected = leads?.find((l) => l.id === selectedId) ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      {/* Pipeline status quick filters + a Filters popover for the rest */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {(["all", ...LEAD_STATUSES] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setStatus(f)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-3 py-1.5 text-[13px] font-medium transition-colors",
                status === f
                  ? "border-[var(--color-indigo)] text-[var(--color-indigo-deeper)]"
                  : "border-[var(--color-slate-200)] text-[var(--color-slate-600)] hover:border-[var(--color-slate-300)]",
              )}
            >
              {filterLabel[f]}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] font-semibold",
                  status === f
                    ? "bg-[var(--color-indigo-50)] text-[var(--color-indigo-deeper)]"
                    : "bg-[var(--color-slate-100)] text-[var(--color-slate-500)]",
                )}
              >
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        <FilterPopover activeCount={activeFilters} onClear={clearFilters}>
          <Label htmlFor="lead-search">Search</Label>
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--color-slate-400)]" />
            <Input
              id="lead-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, email, message…"
              className="pl-9"
            />
          </div>

          {filterFields.map((f) => (
            <div key={f.key} className="mb-3">
              <Label>{f.label}</Label>
              <Select
                value={fieldFilters[f.key] ?? ""}
                onChange={(e) =>
                  setFieldFilters((prev) => ({
                    ...prev,
                    [f.key]: e.target.value,
                  }))
                }
              >
                <option value="">All {f.label.toLowerCase()}</option>
                {f.options!.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            </div>
          ))}

          <div className="mt-1 border-t border-[var(--color-slate-100)] pt-3">
            <Label>Rows per page</Label>
            <Select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </div>
        </FilterPopover>
      </div>

      {/* Table — only the body scrolls; the toolbar (above) and header stay. */}
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
          <>
            {/* Mobile: card list (the table is desktop-only) */}
            <ul className="scroll-slim min-h-0 flex-1 divide-y divide-[var(--color-slate-100)] overflow-auto lg:hidden">
              {pageItems.map((l) => {
                const flag = chatByPhone.get(l.phone);
                const hot = client && quickScore(l, client).tier === "hot";
                return (
                  <li key={l.id}>
                    <button
                      onClick={() => setSelectedId(l.id)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-[var(--color-slate-50)]"
                    >
                      <Avatar
                        size="sm"
                        initials={initials(l.firstName, l.lastName)}
                        accent={client?.accent}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-[14.5px] font-medium">
                            {fullName(l.firstName, l.lastName)}
                          </span>
                          {hot && (
                            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-[var(--radius-pill)] bg-[#FEF2F2] px-1.5 py-0.5 text-[10px] font-bold text-[#DC2626]">
                              <Zap className="size-2.5" />
                              HOT
                            </span>
                          )}
                          {flag?.open && (
                            <MessageSquare
                              className={cn(
                                "size-3.5 shrink-0",
                                flag.needsYou
                                  ? "text-[var(--color-error)]"
                                  : "text-[var(--color-slate-400)]",
                              )}
                            />
                          )}
                        </span>
                        <span className="block truncate text-[12px] text-[var(--color-slate-400)]">
                          {l.email || l.phone}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1.5">
                        <LeadStatusBadge status={l.status} />
                        <span className="text-[11px] text-[var(--color-slate-300)]">
                          {timeAgo(l.createdAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="scroll-slim hidden min-h-0 flex-1 overflow-auto lg:block">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-white">
                  <tr className="border-b border-[var(--color-slate-100)] text-left text-[12px] font-semibold tracking-wide text-[var(--color-slate-400)] uppercase">
                  <SortHeader
                    label="Name"
                    colKey="name"
                    sort={sort}
                    onSort={toggleSort}
                  />
                  {tableFields.map((f) => (
                    <SortHeader
                      key={f.key}
                      label={f.label}
                      colKey={`f:${f.key}`}
                      sort={sort}
                      onSort={toggleSort}
                      className="hidden md:table-cell"
                    />
                  ))}
                  <SortHeader
                    label="Status"
                    colKey="status"
                    sort={sort}
                    onSort={toggleSort}
                  />
                  <SortHeader
                    label="Received"
                    colKey="received"
                    sort={sort}
                    onSort={toggleSort}
                    align="right"
                  />
                </tr>
              </thead>
              <tbody>
                {pageItems.map((l) => (
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
                          <div className="flex items-center gap-1.5 truncate font-medium">
                            {fullName(l.firstName, l.lastName)}
                            {client &&
                              quickScore(l, client).tier === "hot" && (
                                <span
                                  title="AI: hot lead"
                                  className="inline-flex items-center gap-0.5 rounded-[var(--radius-pill)] bg-[#FEF2F2] px-1.5 py-0.5 text-[10px] font-bold text-[#DC2626]"
                                >
                                  <Zap className="size-2.5" />
                                  HOT
                                </span>
                              )}
                            {(() => {
                              const flag = chatByPhone.get(l.phone);
                              if (!flag?.open) return null;
                              return (
                                <MessageSquare
                                  className={cn(
                                    "size-3.5 shrink-0",
                                    flag.needsYou
                                      ? "text-[var(--color-error)]"
                                      : "text-[var(--color-slate-400)]",
                                  )}
                                  aria-label={
                                    flag.needsYou
                                      ? "Live chat needs you"
                                      : "Has a live chat"
                                  }
                                />
                              );
                            })()}
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
            <Pagination
              page={page}
              totalPages={totalPages}
              onPage={setPage}
              totalItems={visible.length}
              pageSize={pageSize}
            />
          </>
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

/** Comparable value for a column, with a "missing" flag so blanks sort last. */
function sortValue(
  lead: Lead,
  key: string,
  schema: FieldDef[],
): { missing: boolean; value: number | string } {
  if (key === "name") {
    const v = `${lead.firstName} ${lead.lastName}`.trim().toLowerCase();
    return { missing: !v, value: v };
  }
  if (key === "status") {
    return { missing: false, value: LEAD_STATUSES.indexOf(lead.status) };
  }
  if (key === "received") {
    return { missing: false, value: new Date(lead.createdAt).getTime() };
  }
  // Schema field column ("f:<key>"), type-aware.
  const fieldKey = key.slice(2);
  const def = schema.find((f) => f.key === fieldKey);
  const raw = lead.fields[fieldKey];
  if (raw === undefined || raw === "") return { missing: true, value: "" };
  if (def?.type === "number") return { missing: false, value: Number(raw) };
  if (def?.type === "date")
    return { missing: false, value: new Date(String(raw)).getTime() };
  return { missing: false, value: String(raw).toLowerCase() };
}

function SortHeader({
  label,
  colKey,
  sort,
  onSort,
  align,
  className,
}: {
  label: string;
  colKey: string;
  sort: { key: string; dir: "asc" | "desc" };
  onSort: (key: string) => void;
  align?: "right";
  className?: string;
}) {
  const active = sort.key === colKey;
  return (
    <th
      className={cn(
        "px-5 py-3 font-semibold",
        align === "right" && "text-right",
        className,
      )}
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(colKey)}
        className={cn(
          "group inline-flex items-center gap-1 font-semibold tracking-wide uppercase transition-colors hover:text-[var(--color-ink-900)]",
          active && "text-[var(--color-slate-600)]",
          align === "right" && "flex-row-reverse",
        )}
      >
        {label}
        {active ? (
          sort.dir === "asc" ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )
        ) : (
          <ChevronsUpDown className="size-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
        )}
      </button>
    </th>
  );
}
