"use client";

import { useEffect, useState } from "react";
import { X, Mail, Phone, Trash2, Check } from "lucide-react";
import type { Lead, LeadStatus } from "@/lib/types";
import { LEAD_STATUSES } from "@/lib/types";
import { updateLead, deleteLead } from "@/lib/store";
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

  useEffect(() => {
    setNotes(lead?.notes ?? "");
    setSavedFlash(false);
  }, [lead]);

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
        className="absolute inset-0 bg-[var(--color-ink-900)]/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <aside className="scroll-slim absolute inset-y-0 right-0 flex w-full max-w-[460px] flex-col overflow-y-auto bg-white shadow-[var(--shadow-lift)]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-[var(--color-slate-100)] bg-white px-6 py-5">
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
        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-[var(--color-slate-100)] bg-white px-6 py-4">
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
