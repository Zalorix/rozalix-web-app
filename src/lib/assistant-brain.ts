import type {
  Conversation,
  KnowledgeEntry,
  AssistantRules,
  Availability,
  AiTurn,
} from "./assistant-types";
import type { Client } from "./types";
import { upcomingSlots } from "./assistant-store";

// ============================================================
// Mock AI Receptionist brain.
//
// A deterministic state machine that stands in for the Claude tool-use
// loop so the whole conversation is demoable with no backend. It is
// grounded ONLY in the client's knowledge base and offers ONLY real
// availability slots — the same guardrails the real agent will enforce.
//
// The real implementation (server-side, claude-opus-4-8, tool-calling) is
// sketched at the bottom of this file. Swapping it in keeps `respond`'s
// signature identical, so the chat widget never changes.
// ============================================================

export interface BrainContext {
  client: Client;
  rules: AssistantRules;
  knowledge: KnowledgeEntry[];
  availability: Availability;
}

const PHONE_RE = /(\+?\d[\d\s\-()]{7,}\d)/;

function extractPhone(text: string): string | null {
  const m = text.match(PHONE_RE);
  if (!m) return null;
  // Normalise PH-style numbers to +63 E.164-ish for the identity key.
  const digits = m[1].replace(/[^\d+]/g, "");
  if (digits.startsWith("09")) return "+63" + digits.slice(1);
  if (digits.startsWith("+")) return digits;
  return digits;
}

/** Naive name capture: a short, mostly-alphabetic snippet near a phone. */
function extractName(text: string): string | null {
  const cleaned = text.replace(PHONE_RE, "").replace(/[,.]/g, " ");
  const words = cleaned
    .split(/\s+/)
    .filter((w) => /^[A-Za-z][A-Za-z'-]{1,}$/.test(w));
  const stop = new Set([
    "im", "i'm", "this", "is", "hi", "hello", "my", "name", "the", "and",
    "sure", "yes", "ok", "okay", "thanks", "please", "its", "it's",
  ]);
  const candidate = words.filter((w) => !stop.has(w.toLowerCase()));
  if (candidate.length && candidate.length <= 2) return candidate.join(" ");
  return null;
}

function matchKnowledge(
  text: string,
  knowledge: KnowledgeEntry[],
): KnowledgeEntry | null {
  const t = text.toLowerCase();
  let best: KnowledgeEntry | null = null;
  let bestHits = 0;
  for (const k of knowledge) {
    const hits = k.keywords.filter((kw) => t.includes(kw)).length;
    if (hits > bestHits) {
      bestHits = hits;
      best = k;
    }
  }
  return bestHits > 0 ? best : null;
}

export function formatSlot(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Try to match the visitor's reply to one of the offered slots. */
function pickSlot(text: string, offered: string[]): string | null {
  const t = text.toLowerCase();
  // by index ("1", "the first one", "option 2")
  const idx = t.match(/\b([1-9])\b/);
  if (idx) {
    const i = Number(idx[1]) - 1;
    if (offered[i]) return offered[i];
  }
  // by weekday or time substring
  for (const iso of offered) {
    const d = new Date(iso);
    const wd = d
      .toLocaleString("en-US", { weekday: "long" })
      .toLowerCase();
    const wdShort = wd.slice(0, 3);
    const hour12 = d.toLocaleString("en-US", { hour: "numeric" }).toLowerCase();
    if (t.includes(wd) || t.includes(wdShort)) {
      // if a time is also mentioned, require it to match the hour
      if (t.includes(hour12.replace(/\s/g, "")) || !/\d/.test(t)) return iso;
      if (t.includes(hour12)) return iso;
      return iso;
    }
    if (t.includes(hour12.replace(/\s/g, "")) || t.includes(`${hour12}`))
      return iso;
  }
  return null;
}

const countAiMessages = (conv: Conversation) =>
  conv.messages.filter((m) => m.role === "ai").length;

/**
 * Produce the AI's response to the latest customer message.
 * Pure: returns reply bubbles + a conversation patch (+ optional booking).
 */
export function respond(
  conv: Conversation,
  lastCustomerText: string,
  ctx: BrainContext,
): AiTurn {
  const { rules, knowledge, availability, client } = ctx;
  const text = lastCustomerText.trim();
  const replies: string[] = [];
  const patch: AiTurn["patch"] = {};

  // Capture contact info whenever it appears.
  const phone = extractPhone(text);
  if (phone && !conv.customerPhone) patch.customerPhone = phone;
  const name = extractName(text);
  if (name && !conv.customerName) patch.customerName = name;

  const knownPhone = patch.customerPhone ?? conv.customerPhone;
  const knownName = patch.customerName ?? conv.customerName;
  const firstName = knownName ? knownName.split(" ")[0] : "";

  // ---- Hard guardrail: escalation ----
  const wantsHuman = rules.escalateKeywords.some((k) =>
    text.toLowerCase().includes(k),
  );
  const overLimit = countAiMessages(conv) >= rules.maxAiMessages;
  if (wantsHuman || overLimit) {
    if (!knownPhone) {
      replies.push(
        `I'd love to get the ${client.name} team to help you directly. Could I grab the best number to reach you?`,
      );
      patch.stage = "awaiting_contact";
    } else {
      replies.push(
        `Thanks${firstName ? ` ${firstName}` : ""} — I've flagged this for the ${client.name} team and they'll reach out to you shortly at ${knownPhone}. 🙏`,
      );
      patch.status = "escalated";
      patch.assignee = "owner";
      patch.stage = "escalated";
    }
    return { replies, patch };
  }

  // ---- Slot selection ----
  if (conv.stage === "awaiting_slot" && conv.offeredSlots.length) {
    const picked = pickSlot(text, conv.offeredSlots);
    if (picked) {
      const summary = conv.messages
        .filter((m) => m.role === "customer")
        .map((m) => m.text)
        .join(" ")
        .slice(0, 140);
      replies.push(
        `Booked! 🎉 The ${client.name} team will call you ${formatSlot(picked)}${knownPhone ? ` at ${knownPhone}` : ""}. Talk soon${firstName ? `, ${firstName}` : ""}!`,
      );
      patch.status = "booked";
      patch.stage = "booked";
      return {
        replies,
        patch,
        booking: {
          customerName: knownName || "Website visitor",
          customerPhone: knownPhone,
          slotISO: picked,
          summary: summary || "Booked a call via web chat.",
        },
      };
    }
    replies.push(
      `No worries — just let me know which of these works: ${conv.offeredSlots
        .map((s, i) => `${i + 1}) ${formatSlot(s)}`)
        .join(", ")}.`,
    );
    return { replies, patch };
  }

  // ---- Answer from knowledge base ----
  const kb = matchKnowledge(text, knowledge);
  if (kb) replies.push(kb.answer);

  // ---- Funnel: collect contact, then offer slots ----
  if (!knownPhone) {
    replies.push(
      kb
        ? `Want me to set up a quick call to go over it? If so, what's your name and best number?`
        : `Happy to help with that! The quickest way is a short call with the team — could I get your name and number to set one up?`,
    );
    patch.stage = "awaiting_contact";
    return { replies, patch };
  }

  // We have a phone → offer real slots.
  const slots = upcomingSlots(availability, 3);
  patch.offeredSlots = slots;
  patch.stage = "awaiting_slot";
  replies.push(
    `Great, thanks${firstName ? ` ${firstName}` : ""}! Here are the next openings — which suits you? ${slots
      .map((s, i) => `${i + 1}) ${formatSlot(s)}`)
      .join(", ")}.`,
  );
  return { replies, patch };
}

// ============================================================
// REFERENCE — real Claude implementation (server-side, future backend).
//
//   import Anthropic from "@anthropic-ai/sdk";
//   const anthropic = new Anthropic(); // ANTHROPIC_API_KEY from env
//
//   // The KB + rules are stable per client → cache them (huge cost win).
//   function systemPrompt(ctx) {
//     return [
//       { type: "text", text:
//         `You are the AI receptionist for ${ctx.client.name} (${ctx.client.domain}). ` +
//         `Persona: ${ctx.rules.persona}. Business hours: ${ctx.rules.businessHours}. ` +
//         `Answer ONLY from the knowledge base below — if it isn't there, say you'll ` +
//         `check with the team and offer a call. Never break these rules: ` +
//         ctx.rules.neverDo.join(" ") + "\n\nKNOWLEDGE BASE:\n" +
//         ctx.knowledge.map(k => `## ${k.topic}\n${k.answer}`).join("\n\n"),
//         cache_control: { type: "ephemeral" } },
//     ];
//   }
//
//   const TOOLS = [
//     { name: "collect_contact", description: "Save the visitor's name and phone.",
//       input_schema: { type: "object",
//         properties: { name: { type: "string" }, phone: { type: "string" } },
//         required: ["phone"], additionalProperties: false } },
//     { name: "offer_availability", description: "Fetch the next bookable call slots.",
//       input_schema: { type: "object", properties: {}, additionalProperties: false } },
//     { name: "book_call", description: "Book a call at a chosen slot and notify the owner.",
//       input_schema: { type: "object",
//         properties: { slot_iso: { type: "string" }, summary: { type: "string" } },
//         required: ["slot_iso", "summary"], additionalProperties: false } },
//     { name: "escalate_to_human", description: "Hand the conversation to the owner.",
//       input_schema: { type: "object",
//         properties: { reason: { type: "string" } }, required: ["reason"],
//         additionalProperties: false } },
//   ];
//
//   // Tool-use loop: send history → if Claude calls a tool, run it server-side
//   // (collect_contact/book_call write the DB; offer_availability calls
//   // upcomingSlots()), feed the tool_result back, repeat until end_turn.
//   // Hard rules (business hours, maxAiMessages, never-quote-unknown-price) are
//   // enforced in the tool handlers, NOT left to the model.
//   export async function respond(conv, lastCustomerText, ctx) {
//     const res = await anthropic.messages.create({
//       model: "claude-opus-4-8",
//       max_tokens: 1024,
//       system: systemPrompt(ctx),
//       tools: TOOLS,
//       messages: conv.messages.map(m => ({
//         role: m.role === "customer" ? "user" : "assistant", content: m.text,
//       })).concat([{ role: "user", content: lastCustomerText }]),
//     });
//     // ...handle tool_use blocks, return { replies, patch, booking }
//   }
// ============================================================
