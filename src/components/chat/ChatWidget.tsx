"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import type { Client } from "@/lib/types";
import type {
  Conversation,
  ChatMessage,
  KnowledgeEntry,
  AssistantRules,
  Availability,
} from "@/lib/assistant-types";
import { getClient, upsertLeadFromChat } from "@/lib/store";
import {
  getRules,
  listKnowledge,
  getAvailability,
  saveConversation,
  getConversation,
  createBooking,
} from "@/lib/assistant-store";
import { respond, type BrainContext } from "@/lib/assistant-brain";
import { AgentAvatar } from "@/components/chat/AgentAvatar";
import { cn } from "@/lib/cn";

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 10)}`;
const nowISO = () => new Date().toISOString();

export function ChatWidget({
  clientId,
  fill,
}: {
  clientId: string;
  /** Fill the parent (used inside the embed iframe) instead of a fixed card. */
  fill?: boolean;
}) {
  const [client, setClient] = useState<Client | null>(null);
  const [agent, setAgent] = useState({ name: "Assistant", icon: "robot" });
  const ctxRef = useRef<BrainContext | null>(null);
  const [conv, setConv] = useState<Conversation | null>(null);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Boot: load client + AI context, start a fresh conversation with a greeting.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [c, rules, knowledge, availability] = await Promise.all([
        getClient(clientId),
        getRules(clientId),
        listKnowledge(clientId),
        getAvailability(clientId),
      ]);
      if (cancelled || !c) return;
      setClient(c);
      setAgent({ name: rules.agentName, icon: rules.agentIcon });
      ctxRef.current = { client: c, rules, knowledge, availability };
      const greeting: ChatMessage = {
        id: uid("m"),
        role: "ai",
        text: rules.greeting,
        createdAt: nowISO(),
      };
      const fresh: Conversation = {
        id: uid("cv"),
        clientId,
        channel: "web",
        customerName: "",
        customerPhone: "",
        status: "active",
        assignee: "ai",
        stage: "discovery",
        offeredSlots: [],
        messages: [greeting],
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      setConv(fresh);
      saveConversation(fresh);
    })();
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  // Auto-scroll on new messages / typing.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [conv?.messages.length, typing]);

  // Poll for owner take-over / owner replies coming from the dashboard, so
  // the customer sees them live. Skip while the AI is mid-reply.
  useEffect(() => {
    if (!conv) return;
    const id = setInterval(async () => {
      if (typing) return;
      const latest = await getConversation(conv.id);
      if (latest && latest.messages.length > conv.messages.length) {
        setConv(latest);
      } else if (latest && latest.assignee !== conv.assignee) {
        setConv(latest);
      }
    }, 2500);
    return () => clearInterval(id);
  }, [conv, typing]);

  async function send() {
    const text = input.trim();
    if (!text || !conv || !ctxRef.current || typing) return;
    setInput("");
    const hadPhone = !!conv.customerPhone;

    // 1. Append the customer message.
    const withCustomer: Conversation = {
      ...conv,
      messages: [
        ...conv.messages,
        { id: uid("m"), role: "customer", text, createdAt: nowISO() },
      ],
      updatedAt: nowISO(),
    };
    setConv(withCustomer);
    await saveConversation(withCustomer);

    // 2. Ask the brain (owner may have taken over — then stay silent).
    if (withCustomer.assignee === "owner") return;
    setTyping(true);
    const turn = respond(withCustomer, text, ctxRef.current);

    // 3. Stream the AI's reply bubbles with a natural delay.
    let working = { ...withCustomer, ...turn.patch } as Conversation;
    for (const reply of turn.replies) {
      await new Promise((r) => setTimeout(r, 700));
      working = {
        ...working,
        messages: [
          ...working.messages,
          { id: uid("m"), role: "ai", text: reply, createdAt: nowISO() },
        ],
        updatedAt: nowISO(),
      };
      setConv(working);
    }
    setTyping(false);

    // 4. Persist, create a booking, and advance the linked lead.
    if (turn.booking) {
      await createBooking({
        id: uid("bk"),
        clientId,
        conversationId: working.id,
        status: "confirmed",
        createdAt: nowISO(),
        ...turn.booking,
      });
      // Booked a call → the lead is Qualified (keyed by phone).
      await upsertLeadFromChat({
        clientId,
        name: working.customerName,
        phone: working.customerPhone,
        message: turn.booking.summary,
        status: "qualified",
      });
    } else if (!hadPhone && working.customerPhone) {
      // First time we captured a number → the lead is Contacted.
      await upsertLeadFromChat({
        clientId,
        name: working.customerName,
        phone: working.customerPhone,
        message: text,
        status: "contacted",
      });
    }
    await saveConversation(working);
  }

  const accent = client?.accent ?? "#4F46E5";

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden bg-white",
        fill
          ? "h-full w-full"
          : "h-[600px] w-full max-w-[400px] rounded-[var(--radius-lg)] border border-[var(--color-slate-200)] shadow-[var(--shadow-lift)]",
      )}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 text-white"
        style={{
          background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 70%, #000 16%))`,
        }}
      >
        <AgentAvatar
          icon={agent.icon}
          accent={accent}
          className="size-9 bg-white/20"
          emojiClassName="text-lg"
        />
        <div className="leading-tight">
          <div className="text-[15px] font-semibold">{agent.name}</div>
          <div className="flex items-center gap-1.5 text-[12px] text-white/80">
            <span className="size-1.5 rounded-full bg-[#4ADE80]" />
            {client?.name ?? "AI assistant"} · replies instantly
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="scroll-slim flex-1 space-y-3 overflow-y-auto bg-[var(--color-slate-50)] px-4 py-4"
      >
        {conv?.messages.map((m) =>
          m.role === "system" ? null : (
            <div
              key={m.id}
              className={cn(
                "flex",
                m.role === "customer" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2 text-[13.5px] leading-relaxed whitespace-pre-wrap",
                  m.role === "customer"
                    ? "rounded-br-sm text-white"
                    : m.role === "owner"
                      ? "rounded-bl-sm border border-[var(--color-indigo-100)] bg-white"
                      : "rounded-bl-sm border border-[var(--color-slate-200)] bg-white",
                )}
                style={
                  m.role === "customer" ? { background: accent } : undefined
                }
              >
                {m.role === "owner" && (
                  <div className="mb-0.5 text-[11px] font-semibold text-[var(--color-indigo)]">
                    {client?.name} team
                  </div>
                )}
                {m.text}
              </div>
            </div>
          ),
        )}
        {typing && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl rounded-bl-sm border border-[var(--color-slate-200)] bg-white px-3.5 py-3">
              <Dot /> <Dot delay={0.15} /> <Dot delay={0.3} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 border-t border-[var(--color-slate-100)] bg-white px-3 py-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          className="min-w-0 flex-1 rounded-[var(--radius-pill)] border border-[var(--color-slate-200)] px-4 py-2.5 text-sm focus:border-[var(--color-indigo)] focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || typing}
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-40"
          style={{ background: accent }}
          aria-label="Send"
        >
          <Send className="size-4.5" />
        </button>
      </form>

      {/* Powered by */}
      <a
        href="https://rozalix.com"
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-1.5 border-t border-[var(--color-slate-100)] bg-white py-2 text-[11px] text-[var(--color-slate-400)] transition-colors hover:text-[var(--color-slate-600)]"
      >
        Powered by
        <svg
          viewBox="21 18 63 63"
          fill="none"
          aria-hidden="true"
          className="size-4 text-[var(--color-indigo)]"
        >
          <rect x="30.5" y="19.5" width="11" height="11" fill="currentColor" />
          <rect x="30.5" y="45.5" width="11" height="11" fill="currentColor" />
          <g
            stroke="currentColor"
            strokeWidth={11}
            strokeLinecap="butt"
            strokeLinejoin="round"
            strokeDasharray="18 7"
          >
            <path d="M36 25 V75" />
            <path d="M36 25 H50 a13 13 0 0 1 0 26 H36" />
          </g>
          <path
            d="M50 51 L70 75"
            stroke="var(--color-violet)"
            strokeWidth={11}
            strokeLinecap="butt"
            strokeDasharray="18 7"
          />
        </svg>
        <span className="font-semibold text-[var(--color-slate-500)]">
          Rozalix
        </span>
      </a>
    </div>
  );
}

function Dot({ delay = 0 }: { delay?: number }) {
  return (
    <span
      className="size-1.5 rounded-full bg-[var(--color-slate-300)]"
      style={{ animation: `rzx-bounce 1s ${delay}s infinite ease-in-out` }}
    >
      <style>{`@keyframes rzx-bounce{0%,80%,100%{transform:translateY(0);opacity:.5}40%{transform:translateY(-4px);opacity:1}}`}</style>
    </span>
  );
}
