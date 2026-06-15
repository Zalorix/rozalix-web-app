"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Inbox,
  Sparkles,
  Trophy,
  FileText,
  ArrowRight,
  TriangleAlert,
  ChevronRight,
} from "lucide-react";
import type { Lead, ContentPage } from "@/lib/types";
import type { Conversation } from "@/lib/assistant-types";
import { useWorkspace } from "@/lib/client-context";
import { listLeads, listContent } from "@/lib/store";
import { listConversations } from "@/lib/assistant-store";
import { fullName, initials, timeAgo, formatDate } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import {
  LeadStatusBadge,
  ContentStatusBadge,
} from "@/components/ui/StatusBadge";
import { EmptyState, Spinner } from "@/components/ui/EmptyState";
import { LeadDrawer } from "@/components/dashboard/LeadDrawer";

export default function DashboardPage() {
  const { client } = useWorkspace();
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [pages, setPages] = useState<ContentPage[] | null>(null);
  const [escalated, setEscalated] = useState<Conversation | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refresh = useMemo(
    () => () => {
      if (!client) return;
      listLeads(client.id).then(setLeads);
      listContent(client.id).then(setPages);
      listConversations(client.id).then((cs) =>
        setEscalated(cs.find((c) => c.status === "escalated") ?? null),
      );
    },
    [client],
  );

  useEffect(() => {
    setLeads(null);
    setPages(null);
    setEscalated(null);
    setSelectedId(null);
    refresh();
  }, [client?.id, refresh]);

  const stats = useMemo(() => {
    const l = leads ?? [];
    return {
      total: l.length,
      isNew: l.filter((x) => x.status === "new").length,
      qualified: l.filter((x) => x.status === "qualified").length,
      won: l.filter((x) => x.status === "won").length,
    };
  }, [leads]);

  const recent = leads?.slice(0, 5) ?? [];
  const selected = leads?.find((l) => l.id === selectedId) ?? null;

  // Generic one-line summary: the first table field's value, else contact.
  function leadSubtitle(l: Lead): string {
    const primary = client?.formSchema.find((f) => f.inTable);
    const value = primary ? l.fields[primary.key] : undefined;
    return value !== undefined && value !== "" ? String(value) : l.email || l.phone;
  }

  // The most recent customer message on the escalated chat, for the alert.
  const escalatedSnippet =
    [...(escalated?.messages ?? [])]
      .reverse()
      .find((m) => m.role === "customer")?.text ?? "A customer is waiting for a reply.";

  return (
    <div className="space-y-6">
      {/* A customer needs you — escalated chat */}
      {escalated && (
        <Link
          href={`/conversations?c=${escalated.id}`}
          className="flex items-center gap-3 rounded-[16px] border border-[var(--color-error-100,#FECACA)] bg-[linear-gradient(180deg,#FFF5F5,#FEF2F2)] p-3.5 shadow-[0_1px_3px_rgba(239,68,68,.08)]"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[11px] bg-[#FEE2E2] text-[#DC2626]">
            <TriangleAlert className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold text-[#991B1B]">
              A customer needs you
            </span>
            <span className="block truncate text-[12.5px] text-[#B91C1C]">
              {escalatedSnippet}
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-[#DC2626]" />
        </Link>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Total leads"
          value={stats.total}
          icon={<Inbox className="size-[18px]" />}
          loading={leads === null}
        />
        <Stat
          label="New"
          value={stats.isNew}
          icon={<Sparkles className="size-[18px]" />}
          accent
          loading={leads === null}
        />
        <Stat
          label="Qualified"
          value={stats.qualified}
          icon={<ArrowRight className="size-[18px]" />}
          loading={leads === null}
        />
        <Stat
          label="Won"
          value={stats.won}
          icon={<Trophy className="size-[18px]" />}
          loading={leads === null}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Recent leads */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent leads"
            action={
              <Link
                href="/leads"
                className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--color-indigo)] hover:underline"
              >
                View all <ArrowRight className="size-3.5" />
              </Link>
            }
          />
          {leads === null ? (
            <div className="flex justify-center py-14">
              <Spinner />
            </div>
          ) : recent.length === 0 ? (
            <EmptyState
              icon={<Inbox className="size-6" />}
              title="No leads yet"
              description="Submissions from your contact form land here."
            />
          ) : (
            <ul>
              {recent.map((l) => (
                <li key={l.id}>
                  <button
                    onClick={() => setSelectedId(l.id)}
                    className="flex w-full items-center gap-3 border-b border-[var(--color-slate-100)] px-5 py-3.5 text-left last:border-0 transition-colors hover:bg-[var(--color-slate-50)]"
                  >
                    <Avatar
                      size="sm"
                      initials={initials(l.firstName, l.lastName)}
                      accent={client?.accent}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {fullName(l.firstName, l.lastName)}
                      </div>
                      <div className="truncate text-[12px] text-[var(--color-slate-400)]">
                        {leadSubtitle(l)}
                      </div>
                    </div>
                    <LeadStatusBadge status={l.status} />
                    <span className="hidden w-20 shrink-0 text-right text-[12px] text-[var(--color-slate-400)] sm:block">
                      {timeAgo(l.createdAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Content summary */}
        <Card>
          <CardHeader
            title="Content"
            action={
              <Link
                href="/content"
                className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--color-indigo)] hover:underline"
              >
                Manage <ArrowRight className="size-3.5" />
              </Link>
            }
          />
          {pages === null ? (
            <div className="flex justify-center py-14">
              <Spinner />
            </div>
          ) : (
            <ul className="px-2 py-2">
              {pages.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/content?slug=${p.slug}`}
                    className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-3 transition-colors hover:bg-[var(--color-slate-50)]"
                  >
                    <span className="flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-slate-100)] text-[var(--color-slate-400)]">
                      <FileText className="size-[18px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {p.title}
                      </div>
                      <div className="truncate text-[12px] text-[var(--color-slate-400)]">
                        Updated {formatDate(p.updatedAt)}
                      </div>
                    </div>
                    <ContentStatusBadge status={p.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <LeadDrawer
        lead={selected}
        onClose={() => setSelectedId(null)}
        onChanged={refresh}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  accent,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: boolean;
  loading?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-[var(--color-slate-500)]">
          {label}
        </span>
        <span
          className={
            accent
              ? "flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-indigo-50)] text-[var(--color-indigo)]"
              : "flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-slate-100)] text-[var(--color-slate-400)]"
          }
        >
          {icon}
        </span>
      </div>
      <div className="mt-3 text-[28px] leading-none font-semibold tracking-tight">
        {loading ? (
          <span className="text-[var(--color-slate-300)]">—</span>
        ) : (
          value
        )}
      </div>
    </Card>
  );
}
