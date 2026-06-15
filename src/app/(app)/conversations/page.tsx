"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  MessageSquare,
  Hand,
  Send,
  Sparkles,
  Search,
  ChevronLeft,
} from "lucide-react";
import type {
  Conversation,
  ChatMessage,
  ConversationStatus,
} from "@/lib/assistant-types";
import type { Lead } from "@/lib/types";
import { useWorkspace } from "@/lib/client-context";
import {
  listConversations,
  saveConversation,
  getRules,
} from "@/lib/assistant-store";
import { listLeads } from "@/lib/store";
import { fullName, timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import {
  ConversationStatusBadge,
  LeadStatusBadge,
} from "@/components/ui/StatusBadge";
import { EmptyState, Spinner } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { FilterPopover } from "@/components/ui/FilterPopover";
import { Input, Select, Label } from "@/components/ui/Field";
import { AgentAvatar } from "@/components/chat/AgentAvatar";
import { useInfiniteCount } from "@/lib/use-infinite-count";
import { useIsDesktop } from "@/lib/use-is-desktop";

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 10)}`;

type ConvFilter = "all" | ConversationStatus;
const CONV_FILTERS: ConvFilter[] = [
  "all",
  "active",
  "escalated",
  "booked",
  "closed",
];
const convFilterLabel: Record<ConvFilter, string> = {
  all: "All",
  active: "Active",
  escalated: "Needs you",
  booked: "Booked",
  closed: "Closed",
};

export default function ConversationsRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      }
    >
      <ConversationsPage />
    </Suspense>
  );
}

function ConversationsPage() {
  const { client } = useWorkspace();
  const searchParams = useSearchParams();
  const [list, setList] = useState<Conversation[] | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Live poll so widget-started chats appear in real time; leads come along
  // so we can show each thread's linked pipeline stage.
  useEffect(() => {
    if (!client) return;
    let active = true;
    const load = async () => {
      const [c, l] = await Promise.all([
        listConversations(client.id),
        listLeads(client.id),
      ]);
      if (!active) return;
      setList(c);
      setLeads(l);
    };
    load();
    const id = setInterval(load, 2500);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [client]);

  // Deep-link: /conversations?c=<id> opens a specific thread.
  useEffect(() => {
    if (!list) return;
    const fromUrl = searchParams.get("c");
    if (fromUrl && !selectedId && list.some((c) => c.id === fromUrl)) {
      setSelectedId(fromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, searchParams]);

  const leadByPhone = useMemo(() => {
    const m = new Map<string, Lead>();
    leads.forEach((l) => l.phone && m.set(l.phone, l));
    return m;
  }, [leads]);

  // Agent identity (for labelling AI messages)
  const [agent, setAgent] = useState({ name: "AI", icon: "✨" });
  useEffect(() => {
    if (client)
      getRules(client.id).then((r) =>
        setAgent({ name: r.agentName, icon: r.agentIcon }),
      );
  }, [client]);

  // Quick filters (status) + search (in the popover)
  const [statusFilter, setStatusFilter] = useState<ConvFilter>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const c: Record<ConvFilter, number> = {
      all: list?.length ?? 0,
      active: 0,
      escalated: 0,
      booked: 0,
      closed: 0,
    };
    list?.forEach((x) => (c[x.status] += 1));
    return c;
  }, [list]);

  const visible = useMemo(() => {
    const base = list ?? [];
    const q = query.trim().toLowerCase();
    return base.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!q) return true;
      return [c.customerName, c.customerPhone, ...c.messages.map((m) => m.text)]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [list, statusFilter, query]);

  const activeFilters = query.trim() ? 1 : 0;

  // Pagination over the filtered list
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const total = visible.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => {
    setPage(1);
  }, [client?.id, pageSize, statusFilter, query]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const pageItems = visible.slice((page - 1) * pageSize, page * pageSize);

  // Mobile: scroll-to-load instead of pagination; desktop keeps pagination.
  const isDesktop = useIsDesktop();
  const { count: mobileCount, sentinelRef } = useInfiniteCount(
    visible.length,
    20,
    `${client?.id}|${statusFilter}|${query}`,
  );
  const listItems = isDesktop ? pageItems : visible.slice(0, mobileCount);

  // Mobile bottom feather: a "more below" hint, only while the list can scroll.
  const mobileListRef = useRef<HTMLUListElement>(null);
  const [showFade, setShowFade] = useState(false);
  function updateFade() {
    const el = mobileListRef.current;
    setShowFade(!!el && el.scrollHeight - el.scrollTop - el.clientHeight > 8);
  }
  useEffect(() => {
    updateFade();
    window.addEventListener("resize", updateFade);
    return () => window.removeEventListener("resize", updateFade);
  }, [listItems.length, list, isDesktop]);

  const selected = useMemo(
    () => list?.find((c) => c.id === selectedId) ?? null,
    [list, selectedId],
  );
  const selectedLead = selected?.customerPhone
    ? leadByPhone.get(selected.customerPhone)
    : undefined;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [selected?.messages.length, selectedId]);

  async function mutate(next: Conversation) {
    setList((prev) => (prev ?? []).map((c) => (c.id === next.id ? next : c)));
    await saveConversation(next);
  }

  async function takeOver() {
    if (!selected) return;
    await mutate({
      ...selected,
      assignee: "owner",
      updatedAt: new Date().toISOString(),
    });
  }

  async function sendOwner() {
    const text = reply.trim();
    if (!text || !selected) return;
    setReply("");
    const msg: ChatMessage = {
      id: uid("m"),
      role: "owner",
      text,
      createdAt: new Date().toISOString(),
    };
    await mutate({
      ...selected,
      assignee: "owner",
      messages: [...selected.messages, msg],
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {/* Filters popover first, then the status quick filters (scroll), then preview */}
      <div className="flex items-center gap-2">
        <FilterPopover activeCount={activeFilters} onClear={() => setQuery("")}>
          <Label htmlFor="conv-search">Search</Label>
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--color-slate-400)]" />
            <Input
              id="conv-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, phone, message…"
              className="pl-9"
            />
          </div>
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
        <div className="no-scrollbar flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
          {CONV_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-pill)] border px-3 py-1.5 text-[13px] font-medium transition-colors",
                statusFilter === f
                  ? "border-[var(--color-indigo)] text-[var(--color-indigo-deeper)]"
                  : "border-[var(--color-slate-200)] text-[var(--color-slate-600)] hover:border-[var(--color-slate-300)]",
              )}
            >
              {convFilterLabel[f]}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] font-semibold",
                  statusFilter === f
                    ? "bg-[var(--color-indigo-50)] text-[var(--color-indigo-deeper)]"
                    : "bg-[var(--color-slate-100)] text-[var(--color-slate-500)]",
                )}
              >
                {counts[f]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:grid-rows-1 lg:gap-5">
        {/* Thread list — only the rows scroll; pagination stays pinned. On
            mobile it fills the screen and hides once a chat is opened. */}
        <Card
          className={cn(
            // Mobile: full-bleed, borderless list (edge-to-edge, scrollbar at
            // the screen edge). Desktop: the bordered 320px column.
            "relative -mx-4 min-h-0 flex-1 flex-col overflow-hidden rounded-none border-0 bg-transparent shadow-none sm:-mx-6 lg:mx-0 lg:flex lg:h-auto lg:min-h-0 lg:rounded-[var(--radius-lg)] lg:border lg:bg-white lg:shadow-[var(--shadow-card)]",
            selected ? "hidden lg:flex" : "flex",
          )}
        >
          {list === null ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : list.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="size-6" />}
              title="No conversations yet"
              description="Chats from your website widget show up here."
            />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="size-6" />}
              title="No matches"
              description="Try clearing the status filter or search."
            />
          ) : (
            <ul
              ref={mobileListRef}
              onScroll={updateFade}
              className="scroll-slim min-h-0 flex-1 overflow-y-auto bg-white lg:bg-transparent"
            >
              {listItems.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      "flex w-full items-start gap-3 border-b border-[var(--color-slate-100)] px-4 py-3.5 text-left transition-colors last:border-0",
                      c.id === selectedId
                        ? "bg-[var(--color-indigo-50)]"
                        : "hover:bg-[var(--color-slate-50)]",
                    )}
                  >
                    <Avatar
                      size="sm"
                      initials={
                        c.customerName
                          ? c.customerName.slice(0, 2).toUpperCase()
                          : "··"
                      }
                      accent={client?.accent}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {c.customerName || "Website visitor"}
                        </span>
                        <ConversationStatusBadge
                          status={c.status}
                          className="ml-auto shrink-0"
                        />
                      </div>
                      <p className="mt-0.5 truncate text-[12px] text-[var(--color-slate-400)]">
                        {c.messages[c.messages.length - 1]?.text}
                      </p>
                      <span className="text-[11px] text-[var(--color-slate-400)]">
                        {timeAgo(c.updatedAt)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
              {!isDesktop && (
                <li>
                  <div ref={sentinelRef} />
                  <p className="py-3 text-center text-[12px] text-[var(--color-slate-400)]">
                    {mobileCount < visible.length
                      ? "Loading more…"
                      : `${visible.length} ${visible.length === 1 ? "chat" : "chats"}`}
                  </p>
                </li>
              )}
            </ul>
          )}
          <div className="hidden lg:block">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPage={setPage}
              totalItems={total}
              pageSize={pageSize}
            />
          </div>

          {/* Mobile-only "more below" feather — hidden once you reach the end */}
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 lg:hidden",
              showFade ? "opacity-90" : "opacity-0",
            )}
          />
        </Card>

        {/* Transcript — full-screen thread on mobile, right pane on desktop */}
        {selected ? (
          <Card className="fixed inset-0 z-50 flex flex-col overflow-hidden rounded-none border-0 shadow-none lg:static lg:z-auto lg:h-auto lg:min-h-0 lg:flex-1 lg:rounded-[var(--radius-lg)] lg:border lg:shadow-[var(--shadow-card)]">
            <div
              className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--color-slate-100)] px-4 py-3.5 sm:px-5"
              style={{ paddingTop: "max(0.875rem, env(safe-area-inset-top))" }}
            >
              <button
                onClick={() => setSelectedId(null)}
                aria-label="Back"
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-slate-100)] text-[var(--color-slate-500)] transition-colors hover:bg-[var(--color-slate-200)] lg:hidden"
              >
                <ChevronLeft className="size-4" />
              </button>
              <Avatar
                size="sm"
                initials={
                  selected.customerName
                    ? selected.customerName.slice(0, 2).toUpperCase()
                    : "··"
                }
                accent={client?.accent}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">
                  {selected.customerName
                    ? fullName(selected.customerName, "")
                    : "Website visitor"}
                </div>
                <div className="truncate text-[12px] text-[var(--color-slate-400)]">
                  {selected.customerPhone || "Phone not collected yet"} · web
                  chat
                </div>
              </div>

              {/* Linked lead context — one lead per conversation, so a single
                  pipeline pill fits cleanly. */}
              {selectedLead && (
                <Link
                  href={`/leads?lead=${selectedLead.id}`}
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--color-slate-200)] py-1 pr-2 pl-1 transition-colors hover:border-[var(--color-slate-300)]"
                  title="View lead"
                >
                  <LeadStatusBadge status={selectedLead.status} />
                  <span className="text-[11px] font-medium text-[var(--color-slate-400)]">
                    view lead
                  </span>
                </Link>
              )}

              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1 text-[12px] font-semibold",
                  selected.assignee === "ai"
                    ? "bg-[var(--color-indigo-50)] text-[var(--color-indigo-deeper)]"
                    : "bg-[var(--color-slate-100)] text-[var(--color-slate-600)]",
                )}
              >
                {selected.assignee === "ai" ? (
                  <>
                    <Sparkles className="size-3" /> AI handling
                  </>
                ) : (
                  "You're handling"
                )}
              </span>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="scroll-slim flex-1 space-y-3 overflow-y-auto bg-[var(--color-slate-50)] px-5 py-4"
            >
              {selected.messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex",
                    m.role === "customer" ? "justify-start" : "justify-end",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[78%] rounded-2xl px-3.5 py-2 text-[13.5px] leading-relaxed whitespace-pre-wrap",
                      m.role === "customer"
                        ? "rounded-bl-sm border border-[var(--color-slate-200)] bg-white"
                        : m.role === "owner"
                          ? "rounded-br-sm bg-[var(--color-ink-900)] text-white"
                          : "rounded-br-sm bg-[var(--color-indigo)] text-white",
                    )}
                  >
                    {m.role !== "customer" && (
                      <div className="mb-0.5 flex items-center gap-1 text-[11px] font-semibold opacity-80">
                        {m.role === "owner" ? (
                          "You"
                        ) : (
                          <>
                            <AgentAvatar
                              icon={agent.icon}
                              accent={client?.accent}
                              className="size-4 bg-white/25"
                              emojiClassName="text-[10px]"
                            />
                            {agent.name}
                          </>
                        )}
                      </div>
                    )}
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Owner controls */}
            <div
              className="border-t border-[var(--color-slate-100)] bg-white px-4 py-3"
              style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
            >
              {selected.assignee === "ai" && (
                <div className="mb-2 flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[var(--color-indigo-50)] px-3 py-2 text-[12.5px] text-[var(--color-indigo-deeper)]">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="size-3.5" /> The AI is handling this
                    chat.
                  </span>
                  <button
                    onClick={takeOver}
                    className="inline-flex items-center gap-1 font-semibold hover:underline"
                  >
                    <Hand className="size-3.5" /> Take over
                  </button>
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendOwner();
                }}
                className="flex items-center gap-2"
              >
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder={
                    selected.assignee === "ai"
                      ? "Message (takes over from the AI)…"
                      : "Reply to the customer…"
                  }
                  className="min-w-0 flex-1 rounded-[var(--radius-md)] border border-[var(--color-slate-200)] px-3.5 py-2.5 text-sm focus:border-[var(--color-indigo)] focus:outline-none"
                />
                <Button type="submit" disabled={!reply.trim()}>
                  <Send className="size-4" /> Send
                </Button>
              </form>
            </div>
          </Card>
        ) : (
          <Card className="hidden items-center justify-center text-sm text-[var(--color-slate-400)] lg:flex lg:h-auto lg:min-h-0">
            Select a conversation to view the transcript
          </Card>
        )}
      </div>
    </div>
  );
}
