"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  Mail,
  Phone,
  Trash2,
  Check,
  Sparkles,
  Zap,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import type { Lead, LeadStatus } from "@/lib/types";
import { LEAD_STATUSES } from "@/lib/types";
import type { Conversation } from "@/lib/assistant-types";
import { updateLead, deleteLead } from "@/lib/store";
import { listConversationsByPhone } from "@/lib/assistant-store";
import { summarizeLead } from "@/lib/ai";
import type { LeadTier } from "@/lib/ai";
import { ConversationStatusBadge } from "@/components/ui/StatusBadge";
import {
  fullName,
  initials,
  formatDateTime,
  formatFieldValue,
} from "@/lib/format";
import { cn } from "@/lib/cn";
import { useCurrentClient } from "@/lib/client-context";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { LeadStatusBadge } from "@/components/ui/StatusBadge";

const tierStyles: Record<LeadTier, string> = {
  hot: "bg-[#FEF2F2] text-[#DC2626]",
  warm: "bg-[var(--color-warning-soft)] text-[#B45309]",
  cold: "bg-[var(--color-slate-100)] text-[var(--color-slate-500)]",
};

const urgencyStyles: Record<string, string> = {
  high: "text-[#DC2626]",
  medium: "text-[#B45309]",
  low: "text-[var(--color-slate-400)]",
};

const statusLabel: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  won: "Won",
  lost: "Lost",
};

export function LeadDrawer({
  lead,
  onClose,
  onChanged,
}: {
  lead: Lead | null;
  onClose: () => void;
  /** Called after a mutation so the parent list can refresh. */
  onChanged: () => void;
}) {
  const client = useCurrentClient();
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  // Conversations linked to this lead (by phone — one lead, many threads).
  const [convos, setConvos] = useState<Conversation[]>([]);

  useEffect(() => {
    setNotes(lead?.notes ?? "");
    setSavedFlash(false);
    setConvos([]);
    if (lead && client) {
      listConversationsByPhone(client.id, lead.phone).then(setConvos);
    }
  }, [lead, client]);

  // Computed synchronously → shown immediately, no loading state. The chat
  // recap folds in once conversations load (a beat later).
  const intel =
    lead && client ? summarizeLead(lead, client, convos) : null;

  // Close on Escape.
  useEffect(() => {
    if (!lead) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lead, onClose]);

  if (!lead) return null;

  async function setStatus(status: LeadStatus) {
    if (!lead) return;
    await updateLead(lead.id, { status });
    onChanged();
  }

  async function saveNotes() {
    if (!lead) return;
    setSavingNotes(true);
    await updateLead(lead.id, { notes });
    setSavingNotes(false);
    setSavedFlash(true);
    onChanged();
    setTimeout(() => setSavedFlash(false), 1800);
  }

  async function remove() {
    if (!lead) return;
    if (!window.confirm("Delete this lead permanently?")) return;
    await deleteLead(lead.id);
    onChanged();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="rzx-backdrop-in absolute inset-0 bg-[var(--color-ink-900)]/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <aside className="rzx-slide-in-right scroll-slim absolute inset-y-0 right-0 flex w-full max-w-[460px] flex-col overflow-y-auto bg-white shadow-[var(--shadow-lift)]">
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-start gap-3 border-b border-[var(--color-slate-100)] bg-white px-6 py-5"
          style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top))" }}
        >
          <Avatar
            size="lg"
            initials={initials(lead.firstName, lead.lastName)}
          />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold">
              {fullName(lead.firstName, lead.lastName)}
            </h2>
            <p className="mt-0.5 text-[13px] text-[var(--color-slate-500)]">
              Submitted {formatDateTime(lead.createdAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-slate-400)] hover:bg-[var(--color-slate-100)] hover:text-[var(--color-ink-900)]"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 px-6 py-6">
          {/* Quick actions — call or email the customer in one tap */}
          <div className="flex gap-2.5">
            <a
              href={`tel:${lead.phone}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-indigo)] px-3 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_2px_6px_rgba(79,70,229,.3)] transition-opacity hover:opacity-90"
            >
              <Phone className="size-4" /> Call
            </a>
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-slate-200)] px-3 py-2.5 text-[13.5px] font-semibold text-[var(--color-slate-700)] transition-colors hover:bg-[var(--color-slate-50)]"
              >
                <Mail className="size-4" /> Email
              </a>
            )}
          </div>

          {/* Customer summary (AI) — a fast read across form data + chat. */}
          <section
            className="rounded-[var(--radius-lg)] border border-[var(--color-indigo-100)] p-4"
            style={{
              background:
                "linear-gradient(180deg, var(--color-indigo-50), #fff 70%)",
            }}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-[var(--color-indigo)] text-white">
                <Sparkles className="size-3.5" />
              </span>
              <h3 className="text-[13px] font-semibold">Customer summary</h3>
              {intel && (
                <span
                  className={cn(
                    "ml-auto inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-1 text-[12px] font-semibold capitalize",
                    tierStyles[intel.tier],
                  )}
                >
                  {intel.tier === "hot" && <Zap className="size-3" />}
                  {intel.tier} · {intel.score}
                </span>
              )}
            </div>

            {intel && (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-[var(--color-slate-700)]">
                  {intel.summary}
                </p>
                {intel.conversationNote && (
                  <div className="flex gap-2 rounded-[var(--radius-md)] bg-white/70 px-3 py-2 text-[13px] text-[var(--color-slate-700)]">
                    <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-[var(--color-indigo)]" />
                    <span>{intel.conversationNote}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 text-[13px]">
                  <div>
                    <div className="text-[11px] text-[var(--color-slate-400)]">
                      Urgency
                    </div>
                    <div
                      className={cn(
                        "font-semibold capitalize",
                        urgencyStyles[intel.urgency],
                      )}
                    >
                      {intel.urgency}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[var(--color-slate-400)]">
                      Est. value
                    </div>
                    <div className="font-semibold">{intel.estimatedValue}</div>
                  </div>
                </div>
                <div className="rounded-[var(--radius-md)] bg-white/70 px-3 py-2 text-[13px]">
                  <span className="font-semibold text-[var(--color-indigo-deeper)]">
                    Next:{" "}
                  </span>
                  {intel.suggestedAction}
                </div>
              </div>
            )}
          </section>

          {/* Status picker */}
          <section>
            <h3 className="mb-2 text-[12px] font-semibold tracking-wide text-[var(--color-slate-400)] uppercase">
              Status
            </h3>
            <div className="flex flex-wrap gap-2">
              {LEAD_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    "rounded-[var(--radius-pill)] border px-3 py-1.5 text-[13px] font-medium transition-colors",
                    lead.status === s
                      ? "border-[var(--color-indigo)] bg-[var(--color-indigo-50)] text-[var(--color-indigo-deeper)]"
                      : "border-[var(--color-slate-200)] text-[var(--color-slate-600)] hover:border-[var(--color-slate-300)]",
                  )}
                >
                  {statusLabel[s]}
                </button>
              ))}
            </div>
          </section>

          {/* Contact details */}
          <section className="space-y-3">
            <h3 className="text-[12px] font-semibold tracking-wide text-[var(--color-slate-400)] uppercase">
              Contact
            </h3>
            <Detail icon={<Mail className="size-4" />} label="Email">
              {lead.email ? (
                <a
                  href={`mailto:${lead.email}`}
                  className="text-[var(--color-indigo)] hover:underline"
                >
                  {lead.email}
                </a>
              ) : (
                <span className="text-[var(--color-slate-400)]">
                  Not provided
                </span>
              )}
            </Detail>
            <Detail icon={<Phone className="size-4" />} label="Phone">
              <a
                href={`tel:${lead.phone}`}
                className="text-[var(--color-indigo)] hover:underline"
              >
                {lead.phone}
              </a>
            </Detail>
          </section>

          {/* Enquiry — custom fields rendered from the client's form schema */}
          <section className="space-y-3">
            <h3 className="text-[12px] font-semibold tracking-wide text-[var(--color-slate-400)] uppercase">
              Enquiry
            </h3>
            {client && client.formSchema.length > 0 && (
              <dl className="grid grid-cols-2 gap-3">
                {client.formSchema.map((f) => (
                  <div key={f.key}>
                    <dt className="text-[12px] text-[var(--color-slate-400)]">
                      {f.label}
                    </dt>
                    <dd className="mt-0.5 text-sm font-medium">
                      {formatFieldValue(lead.fields[f.key], f.type)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            <div>
              <p className="mb-1 text-[12px] text-[var(--color-slate-400)]">
                Message
              </p>
              <p className="rounded-[var(--radius-md)] bg-[var(--color-slate-50)] px-4 py-3 text-sm leading-relaxed text-[var(--color-slate-700)]">
                {lead.message}
              </p>
            </div>
          </section>

          {/* Linked conversations — one lead can have many threads. */}
          {convos.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-[12px] font-semibold tracking-wide text-[var(--color-slate-400)] uppercase">
                Conversations
              </h3>
              {convos.map((c) => (
                <Link
                  key={c.id}
                  href={`/conversations?c=${c.id}`}
                  className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-slate-200)] px-3 py-2.5 transition-colors hover:border-[var(--color-slate-300)] hover:bg-[var(--color-slate-50)]"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-slate-100)] text-[var(--color-slate-400)]">
                    <MessageSquare className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] text-[var(--color-slate-600)]">
                      {c.messages[c.messages.length - 1]?.text}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[var(--color-slate-400)] capitalize">
                      {c.channel} chat
                    </div>
                  </div>
                  <ConversationStatusBadge status={c.status} />
                  <ChevronRight className="size-4 shrink-0 text-[var(--color-slate-300)]" />
                </Link>
              ))}
            </section>
          )}

          {/* Notes */}
          <section>
            <h3 className="mb-2 text-[12px] font-semibold tracking-wide text-[var(--color-slate-400)] uppercase">
              Internal notes
            </h3>
            <Textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note for your team…"
            />
            <div className="mt-2 flex items-center gap-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={saveNotes}
                disabled={savingNotes || notes === lead.notes}
              >
                {savedFlash ? (
                  <>
                    <Check className="size-4 text-[var(--color-success)]" />{" "}
                    Saved
                  </>
                ) : (
                  "Save notes"
                )}
              </Button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div
          className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-[var(--color-slate-100)] bg-white px-6 py-4"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <LeadStatusBadge status={lead.status} />
          <Button size="sm" variant="danger" onClick={remove}>
            <Trash2 className="size-4" /> Delete
          </Button>
        </div>
      </aside>
    </div>
  );
}

function Detail({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="flex size-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-slate-100)] text-[var(--color-slate-400)]">
        {icon}
      </span>
      <span className="w-16 shrink-0 text-[var(--color-slate-400)]">
        {label}
      </span>
      <span className="min-w-0 truncate font-medium">{children}</span>
    </div>
  );
}
