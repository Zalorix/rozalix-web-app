// ============================================================
// AI Receptionist domain — Phase 1 (web chat).
//
// The assistant holds a conversation, qualifies the visitor, collects a
// phone (the canonical customer identity / merge key for future channels),
// offers the owner's availability, books a call, and escalates when stuck.
//
// Shapes mirror what the future Express/Neon backend will own. The mock
// brain + store stand in for now so the whole loop is demoable.
// ============================================================

export type Channel = "web" | "sms" | "messenger";

export type ConversationStatus =
  | "active" // AI is handling it
  | "booked" // a call was booked
  | "escalated" // needs the owner
  | "closed";

export type Assignee = "ai" | "owner";

/** Where the visitor is in the funnel — drives the mock brain. */
export type Stage =
  | "greeting"
  | "discovery"
  | "awaiting_contact"
  | "awaiting_slot"
  | "booked"
  | "escalated";

export type MessageRole = "customer" | "ai" | "owner" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  clientId: string;
  channel: Channel;
  /** Collected during the chat; the canonical identity once known. */
  customerName: string;
  customerPhone: string;
  status: ConversationStatus;
  /** Who is currently responding — flips to "owner" on take-over. */
  assignee: Assignee;
  stage: Stage;
  /** ISO slot times the AI has offered, so booking is deterministic. */
  offeredSlots: string[];
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

/** A single grounding fact the AI may use — nothing outside this is invented. */
export interface KnowledgeEntry {
  id: string;
  clientId: string;
  topic: string;
  /** Keywords that map an inbound question to this entry. */
  keywords: string[];
  answer: string;
}

/** Per-client guardrails + persona. Hard rules are enforced in code. */
export interface AssistantRules {
  clientId: string;
  /** Display name for the AI agent (e.g. "Rio"). */
  agentName: string;
  /** Agent avatar — an emoji shown in the chat header and on AI messages. */
  agentIcon: string;
  /** First message the AI opens with. */
  greeting: string;
  /** Persona / tone guidance (soft — goes in the prompt). */
  persona: string;
  /** Human-readable business hours, shown to the visitor. */
  businessHours: string;
  /** Hard guardrails the AI must never violate. */
  neverDo: string[];
  /** Inbound phrases that force an escalation to the owner. */
  escalateKeywords: string[];
  /** Hard cap on AI turns before handing off. */
  maxAiMessages: number;
}

/** Weekly availability the AI may offer. day index: 0=Sun … 6=Sat. */
export interface Availability {
  clientId: string;
  /** Call length in minutes. */
  durationMins: number;
  /** Times (24h "HH:MM") offered per weekday. */
  days: Record<number, string[]>;
}

export type BookingStatus = "confirmed" | "completed" | "cancelled";

export interface Booking {
  id: string;
  clientId: string;
  conversationId: string;
  customerName: string;
  customerPhone: string;
  /** ISO datetime of the booked call. */
  slotISO: string;
  /** One-line context the AI captured for the owner. */
  summary: string;
  status: BookingStatus;
  createdAt: string;
}

/**
 * What the brain returns for one inbound message: the AI's reply bubbles,
 * a patch to apply to the conversation, and an optional booking to create.
 */
export interface AiTurn {
  replies: string[];
  patch: Partial<
    Pick<
      Conversation,
      "customerName" | "customerPhone" | "status" | "assignee" | "stage" | "offeredSlots"
    >
  >;
  booking?: Omit<Booking, "id" | "clientId" | "conversationId" | "createdAt" | "status">;
}
