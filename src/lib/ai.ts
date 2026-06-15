import type { Client, Lead } from "./types";
import type { Conversation } from "./assistant-types";
import { fullName } from "./format";

// ============================================================
// AI Lead Concierge — the competitive-edge feature.
//
// Speed-to-lead is the biggest conversion lever for SMBs: the moment a
// lead arrives we (1) score + summarise it so the owner knows who to call
// first, and (2) draft a warm, on-brand reply they can send in one click.
//
// TODAY (static demo): the two functions below return mock results derived
// from the lead's own content, with simulated latency so the UI exercises
// real loading states. No API key, runs entirely in the browser.
//
// LATER (Express + Neon backend): replace each function body with the
// Claude call sketched in the reference block at the bottom of this file.
// The signatures and return types stay identical, so no UI component
// changes. The Claude SDK must run server-side only — never ship an API
// key to the browser.
// ============================================================

export type LeadTier = "hot" | "warm" | "cold";
export type Urgency = "high" | "medium" | "low";

export interface LeadIntelligence {
  /** 0–100 fit/intent score. */
  score: number;
  tier: LeadTier;
  urgency: Urgency;
  /** One-line read on what the lead wants. */
  summary: string;
  /** Recommended next step for the owner. */
  suggestedAction: string;
  /** Rough deal value, human-readable (e.g. "₱60,000+"). */
  estimatedValue: string;
  /** Recap of any AI conversation this customer has had (cross-channel). */
  conversationNote?: string;
}

/** One-line recap of the customer's most recent AI conversation, if any. */
function recapConversations(convos?: Conversation[]): string | undefined {
  if (!convos || convos.length === 0) return undefined;
  const c = convos[0]; // most recent
  const lastCustomer = [...c.messages]
    .reverse()
    .find((m) => m.role === "customer")?.text;
  const base =
    c.status === "booked"
      ? "Chatted via web and booked a call."
      : c.status === "escalated"
        ? "Web chat escalated — waiting on you."
        : c.status === "active"
          ? "Has an open web chat right now."
          : "Previously chatted via web.";
  const snippet = lastCustomer
    ? ` Last said: “${lastCustomer.slice(0, 80)}${lastCustomer.length > 80 ? "…" : ""}”`
    : "";
  return base + snippet;
}

const LATENCY = 600; // ms — simulates the model round-trip

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY));
}

const URGENT_WORDS = [
  "urgent",
  "asap",
  "deadline",
  "soon",
  "next week",
  "this week",
  "launch",
  "before",
  "quickly",
  "rush",
];

/** Pull the most "value-like" field text from a lead's custom fields. */
function valueSignal(lead: Lead): string {
  const candidates = Object.values(lead.fields).map((v) => String(v));
  const moneyish = candidates.find((v) => /₱|\d{2,}|custom|commerce/i.test(v));
  return moneyish ?? "";
}

function tierFor(score: number): LeadTier {
  return score >= 70 ? "hot" : score >= 45 ? "warm" : "cold";
}

/**
 * Synchronous score — represents the value the model computes once on lead
 * ingest and stores on the record. Used for instant list badges (no extra
 * round-trips when rendering a table of leads).
 */
export function quickScore(lead: Lead, client: Client): {
  score: number;
  tier: LeadTier;
} {
  const text = `${lead.message} ${Object.values(lead.fields)
    .map(String)
    .join(" ")}`.toLowerCase();

  let score = 48;
  const vs = valueSignal(lead).toLowerCase();
  if (/custom|commerce|120|60,000/.test(vs)) score += 22;
  else if (/35,000|growth|business|25,000/.test(vs)) score += 12;
  if (lead.email) score += 6; // reachable by email
  if (lead.message.length > 140) score += 8; // detailed enquiry
  if (lead.status === "qualified") score += 10;
  if (lead.status === "won") score += 18;
  if (lead.status === "lost") score -= 30;
  if (/not sure|just (looking|browsing)|maybe/.test(text)) score -= 10;
  // client-specific: a high guest count / big project reads as higher value
  void client;
  score = Math.max(4, Math.min(98, score));

  return { score, tier: tierFor(score) };
}

/**
 * Score + summarise a lead — SYNCHRONOUS. The mock heuristic computes instantly
 * so the UI can render the summary on open with no loading state. (With a real
 * backend, the async `analyzeLead` below is the swap point + a skeleton.)
 */
export function summarizeLead(
  lead: Lead,
  client: Client,
  conversations?: Conversation[],
): LeadIntelligence {
  const text = `${lead.message} ${Object.values(lead.fields)
    .map(String)
    .join(" ")}`.toLowerCase();

  const { score, tier } = quickScore(lead, client);
  const conversationNote = recapConversations(conversations);

  // ---- urgency ----
  const urgent = URGENT_WORDS.some((w) => text.includes(w));
  const urgency: Urgency = urgent
    ? "high"
    : lead.status === "new"
      ? "medium"
      : "low";

  // ---- estimated value ----
  const estimatedValue = valueSignal(lead) || "To be qualified";

  // ---- summary ----
  const fieldBits = client.formSchema
    .filter((f) => f.inTable && lead.fields[f.key])
    .map((f) => `${f.label.toLowerCase()} ${lead.fields[f.key]}`)
    .slice(0, 2)
    .join(", ");
  const summary = fieldBits
    ? `${fullName(lead.firstName, lead.lastName)} — ${fieldBits}. ${urgent ? "Time-sensitive." : "Worth a personal follow-up."}`
    : `${fullName(lead.firstName, lead.lastName)} sent a general enquiry. ${urgent ? "Mentions a deadline." : ""}`.trim();

  // ---- suggested action ----
  const suggestedAction =
    lead.status === "won"
      ? "Won — move to onboarding and confirm the deposit."
      : lead.status === "lost"
        ? "Marked lost. Archive or add to a nurture list."
        : tier === "hot"
          ? urgent
            ? "Call within the hour — strong intent and a deadline."
            : "Reach out today with a tailored quote while interest is high."
          : tier === "warm"
            ? "Send a friendly reply with a few clarifying questions."
            : "Low priority — a short templated reply is enough for now.";

  return {
    score,
    tier,
    urgency,
    summary,
    suggestedAction,
    estimatedValue,
    conversationNote,
  };
}

/** Async wrapper — the swap point for the real Claude call (see reference). */
export async function analyzeLead(
  lead: Lead,
  client: Client,
  conversations?: Conversation[],
): Promise<LeadIntelligence> {
  return delay(summarizeLead(lead, client, conversations));
}

/**
 * Draft a warm, on-brand first reply to a lead. Mock weaves in the lead's
 * actual details so it doesn't read as canned.
 */
export async function draftReply(
  lead: Lead,
  client: Client,
): Promise<string> {
  const first = lead.firstName || "there";
  const detailField = client.formSchema.find((f) => f.inTable && lead.fields[f.key]);
  const detail = detailField
    ? ` about your ${String(lead.fields[detailField.key]).toLowerCase()}`
    : "";
  const snippet = lead.message.split(/[.!?]/)[0]?.trim();

  const body = `Hi ${first},

Thank you so much for reaching out to ${client.name}${detail} — we'd love to help.

${snippet ? `I read your note about "${snippet.toLowerCase()}" and it sounds like a great fit for what we do.` : "Your enquiry sounds like a great fit for what we do."} To put together the right proposal, could we set up a quick 15-minute call this week?

In the meantime, feel free to reply here with any questions.

Warm regards,
The ${client.name} team`;

  return delay(body);
}

// ============================================================
// REFERENCE — real Claude implementation for the future backend.
// Lives server-side (Express route). Drop these in to replace the mocks.
//
//   import Anthropic from "@anthropic-ai/sdk";
//   const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
//
//   const INTEL_SCHEMA = {
//     type: "object",
//     properties: {
//       score: { type: "integer" },
//       tier: { type: "string", enum: ["hot", "warm", "cold"] },
//       urgency: { type: "string", enum: ["high", "medium", "low"] },
//       summary: { type: "string" },
//       suggestedAction: { type: "string" },
//       estimatedValue: { type: "string" },
//     },
//     required: ["score","tier","urgency","summary","suggestedAction","estimatedValue"],
//     additionalProperties: false,
//   } as const;
//
//   export async function analyzeLead(lead, client) {
//     const res = await anthropic.messages.create({
//       model: "claude-opus-4-8",
//       max_tokens: 1024,
//       system:
//         `You are a sales concierge for ${client.name} (${client.domain}). ` +
//         `Score and triage inbound website leads for a small business owner. ` +
//         `Be concise and practical.`,
//       messages: [{ role: "user", content: JSON.stringify(lead) }],
//       output_config: { format: { type: "json_schema", schema: INTEL_SCHEMA } },
//     });
//     const text = res.content.find((b) => b.type === "text").text;
//     return JSON.parse(text);
//   }
//
//   export async function draftReply(lead, client) {
//     const res = await anthropic.messages.create({
//       model: "claude-opus-4-8",
//       max_tokens: 1024,
//       system:
//         `Write a warm, professional first reply on behalf of ${client.name}. ` +
//         `Reference the lead's specific request. Keep it under 120 words, ` +
//         `propose a next step, and sign off as "The ${client.name} team".`,
//       messages: [{ role: "user", content: JSON.stringify(lead) }],
//     });
//     return res.content.find((b) => b.type === "text").text;
//   }
// ============================================================
