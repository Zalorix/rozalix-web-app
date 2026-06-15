"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  ShieldCheck,
  CalendarClock,
  Plus,
  Trash2,
  Check,
  ImagePlus,
} from "lucide-react";
import type {
  KnowledgeEntry,
  AssistantRules,
  Availability,
} from "@/lib/assistant-types";
import { useWorkspace } from "@/lib/client-context";
import {
  listKnowledge,
  saveKnowledge,
  deleteKnowledge,
  getRules,
  saveRules,
  getAvailability,
  saveAvailability,
  upcomingSlots,
} from "@/lib/assistant-store";
import { formatSlot } from "@/lib/assistant-brain";
import { readAvatar } from "@/lib/image";
import { AgentAvatar, isImageIcon } from "@/components/chat/AgentAvatar";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label } from "@/components/ui/Field";
import { EmojiPickerButton } from "@/components/ui/EmojiPickerButton";
import { Spinner } from "@/components/ui/EmptyState";

type Tab = "knowledge" | "rules" | "availability";

const TABS: { id: Tab; label: string; icon: typeof BookOpen }[] = [
  { id: "knowledge", label: "Knowledge base", icon: BookOpen },
  { id: "rules", label: "Rules & persona", icon: ShieldCheck },
  { id: "availability", label: "Availability", icon: CalendarClock },
];

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 10)}`;

export default function AssistantPage() {
  const { client } = useWorkspace();
  const [tab, setTab] = useState<Tab>("knowledge");

  return (
    <div className="space-y-5">
      <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-[var(--color-slate-200)]">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                tab === t.id
                  ? "border-[var(--color-indigo)] text-[var(--color-indigo-deeper)]"
                  : "border-transparent text-[var(--color-slate-500)] hover:text-[var(--color-ink-900)]",
              )}
            >
              <Icon className="size-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {client && tab === "knowledge" && <KnowledgeTab clientId={client.id} />}
      {client && tab === "rules" && <RulesTab clientId={client.id} />}
      {client && tab === "availability" && (
        <AvailabilityTab clientId={client.id} />
      )}
    </div>
  );
}

function SaveButton({
  onClick,
  saved,
  disabled,
}: {
  onClick: () => void;
  saved: boolean;
  disabled?: boolean;
}) {
  return (
    <Button size="sm" onClick={onClick} disabled={disabled}>
      {saved ? (
        <>
          <Check className="size-4" /> Saved
        </>
      ) : (
        "Save"
      )}
    </Button>
  );
}

// ---------------------------- Knowledge ----------------------------

function KnowledgeTab({ clientId }: { clientId: string }) {
  const [entries, setEntries] = useState<KnowledgeEntry[] | null>(null);

  useEffect(() => {
    listKnowledge(clientId).then(setEntries);
  }, [clientId]);

  function addEntry() {
    const fresh: KnowledgeEntry = {
      id: uid("kb"),
      clientId,
      topic: "New topic",
      keywords: [],
      answer: "",
    };
    setEntries((prev) => [...(prev ?? []), fresh]);
  }

  if (entries === null)
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-slate-500)]">
        The AI answers strictly from these facts. If a question isn&apos;t
        covered, it asks or offers a call instead of guessing.
      </p>
      {entries.map((e) => (
        <KnowledgeCard
          key={e.id}
          entry={e}
          onRemoved={() =>
            setEntries((prev) => (prev ?? []).filter((x) => x.id !== e.id))
          }
        />
      ))}
      <Button variant="secondary" onClick={addEntry}>
        <Plus className="size-4" /> Add entry
      </Button>
    </div>
  );
}

function KnowledgeCard({
  entry,
  onRemoved,
}: {
  entry: KnowledgeEntry;
  onRemoved: () => void;
}) {
  const [topic, setTopic] = useState(entry.topic);
  const [keywords, setKeywords] = useState(entry.keywords.join(", "));
  const [answer, setAnswer] = useState(entry.answer);
  const [saved, setSaved] = useState(false);

  async function save() {
    await saveKnowledge({
      ...entry,
      topic,
      keywords: keywords
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean),
      answer,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }

  async function remove() {
    await deleteKnowledge(entry.id);
    onRemoved();
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="max-w-xs font-semibold"
        />
        <button
          onClick={remove}
          className="ml-auto flex size-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-slate-400)] hover:bg-[var(--color-error-soft)] hover:text-[var(--color-error)]"
          title="Delete"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <Label>Answer</Label>
      <Textarea
        rows={3}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      />
      <div className="mt-3">
        <Label>Trigger keywords (comma-separated)</Label>
        <Input
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="price, cost, how much"
        />
      </div>
      <div className="mt-3 flex justify-end">
        <SaveButton onClick={save} saved={saved} />
      </div>
    </Card>
  );
}

// ---------------------------- Rules ----------------------------

function RulesTab({ clientId }: { clientId: string }) {
  const [rules, setRules] = useState<AssistantRules | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getRules(clientId).then(setRules);
  }, [clientId]);

  if (!rules)
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );

  const set = (patch: Partial<AssistantRules>) =>
    setRules((r) => (r ? { ...r, ...patch } : r));

  async function save() {
    if (!rules) return;
    await saveRules(rules);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }

  return (
    <Card className="space-y-4 p-5">
      {/* Agent identity */}
      <div className="flex flex-wrap items-end gap-4 rounded-[var(--radius-md)] border border-[var(--color-slate-100)] bg-[var(--color-slate-50)] p-4">
        <AgentAvatar
          icon={rules.agentIcon}
          className="size-12 text-white"
          emojiClassName="text-2xl"
          style={{
            background:
              "linear-gradient(140deg, var(--color-indigo), var(--color-violet))",
          }}
        />
        <div className="min-w-[140px] flex-1">
          <Label>Agent name</Label>
          <Input
            value={rules.agentName}
            onChange={(e) => set({ agentName: e.target.value })}
            placeholder="e.g. Rio"
          />
        </div>
        <div>
          <Label>Icon</Label>
          <div className="flex items-center gap-2">
            <EmojiPickerButton
              value={rules.agentIcon}
              isEmoji={!isImageIcon(rules.agentIcon)}
              onPick={(emoji) => set({ agentIcon: emoji })}
            />
            <label
              title="Upload an image"
              className={cn(
                "flex size-9 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border transition-colors",
                isImageIcon(rules.agentIcon)
                  ? "border-[var(--color-indigo)] bg-white text-[var(--color-indigo)]"
                  : "border-dashed border-[var(--color-slate-300)] text-[var(--color-slate-500)] hover:bg-white",
              )}
            >
              <ImagePlus className="size-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) set({ agentIcon: await readAvatar(file) });
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>
      </div>

      <div>
        <Label>Greeting</Label>
        <Textarea
          rows={2}
          value={rules.greeting}
          onChange={(e) => set({ greeting: e.target.value })}
        />
      </div>
      <div>
        <Label>Persona &amp; tone</Label>
        <Textarea
          rows={2}
          value={rules.persona}
          onChange={(e) => set({ persona: e.target.value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Business hours</Label>
          <Input
            value={rules.businessHours}
            onChange={(e) => set({ businessHours: e.target.value })}
          />
        </div>
        <div>
          <Label>Max AI messages before handoff</Label>
          <Input
            type="number"
            value={rules.maxAiMessages}
            onChange={(e) =>
              set({ maxAiMessages: Number(e.target.value) || 0 })
            }
          />
        </div>
      </div>
      <div>
        <Label>Guardrails — the AI will never do these (one per line)</Label>
        <Textarea
          rows={3}
          value={rules.neverDo.join("\n")}
          onChange={(e) =>
            set({ neverDo: e.target.value.split("\n").filter(Boolean) })
          }
        />
      </div>
      <div>
        <Label>Escalation triggers (comma-separated)</Label>
        <Input
          value={rules.escalateKeywords.join(", ")}
          onChange={(e) =>
            set({
              escalateKeywords: e.target.value
                .split(",")
                .map((k) => k.trim().toLowerCase())
                .filter(Boolean),
            })
          }
        />
      </div>
      <div className="flex justify-end">
        <SaveButton onClick={save} saved={saved} />
      </div>
    </Card>
  );
}

// ---------------------------- Availability ----------------------------

const DAYS = [
  { i: 1, label: "Monday" },
  { i: 2, label: "Tuesday" },
  { i: 3, label: "Wednesday" },
  { i: 4, label: "Thursday" },
  { i: 5, label: "Friday" },
  { i: 6, label: "Saturday" },
  { i: 0, label: "Sunday" },
];

function AvailabilityTab({ clientId }: { clientId: string }) {
  const [av, setAv] = useState<Availability | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getAvailability(clientId).then(setAv);
  }, [clientId]);

  if (!av)
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );

  function setDay(dayIndex: number, value: string) {
    const times = value
      .split(",")
      .map((t) => t.trim())
      .filter((t) => /^\d{1,2}:\d{2}$/.test(t));
    setAv((a) => (a ? { ...a, days: { ...a.days, [dayIndex]: times } } : a));
  }

  async function save() {
    if (!av) return;
    // drop empty days
    const cleaned: Availability["days"] = {};
    Object.entries(av.days).forEach(([k, v]) => {
      if (v.length) cleaned[Number(k)] = v;
    });
    await saveAvailability({ ...av, days: cleaned });
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }

  const preview = upcomingSlots(av, 4);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
      <Card className="space-y-4 p-5">
        <div className="max-w-[200px]">
          <Label>Call length (minutes)</Label>
          <Input
            type="number"
            value={av.durationMins}
            onChange={(e) =>
              setAv((a) =>
                a ? { ...a, durationMins: Number(e.target.value) || 0 } : a,
              )
            }
          />
        </div>
        <div className="space-y-2.5">
          {DAYS.map((d) => (
            <div key={d.i} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-sm font-medium text-[var(--color-slate-600)]">
                {d.label}
              </span>
              <Input
                value={(av.days[d.i] ?? []).join(", ")}
                onChange={(e) => setDay(d.i, e.target.value)}
                placeholder="e.g. 09:00, 11:00, 14:00"
                className="flex-1"
              />
            </div>
          ))}
        </div>
        <p className="text-[12px] text-[var(--color-slate-400)]">
          Use 24-hour times, comma-separated. Leave a day blank for no
          availability.
        </p>
        <div className="flex justify-end">
          <SaveButton onClick={save} saved={saved} />
        </div>
      </Card>

      <Card className="h-max p-5">
        <h3 className="text-[13px] font-semibold tracking-wide text-[var(--color-slate-400)] uppercase">
          Next slots the AI will offer
        </h3>
        <ul className="mt-3 space-y-2">
          {preview.length ? (
            preview.map((s) => (
              <li
                key={s}
                className="rounded-[var(--radius-md)] bg-[var(--color-slate-50)] px-3 py-2 text-sm font-medium"
              >
                {formatSlot(s)}
              </li>
            ))
          ) : (
            <li className="text-sm text-[var(--color-slate-400)]">
              Add some times to generate slots.
            </li>
          )}
        </ul>
      </Card>
    </div>
  );
}
