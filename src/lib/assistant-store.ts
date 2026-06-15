import type {
  Conversation,
  KnowledgeEntry,
  AssistantRules,
  Availability,
  Booking,
} from "./assistant-types";
import {
  KNOWLEDGE,
  RULES,
  AVAILABILITY,
  CONVERSATIONS,
  BOOKINGS,
} from "./assistant-seed";

// ============================================================
// Assistant store — localStorage-backed, async (Promise) so swapping to
// the Express/Neon API later is a per-function change with no UI impact.
// Conversations embed their messages for simplicity.
// ============================================================

const KEYS = {
  conversations: "rzx.conversations.v2",
  bookings: "rzx.bookings.v1",
  knowledge: "rzx.knowledge.v1",
  rules: "rzx.rules.v2",
  availability: "rzx.availability.v1",
} as const;

function read<T>(key: string, seed: T[]): T[] {
  if (typeof window === "undefined") return seed;
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    window.localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return seed;
  }
}

function write<T>(key: string, value: T[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

const tiny = <T>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 120));

// ---------------------------- Conversations ----------------------------

export async function listConversations(
  clientId: string,
): Promise<Conversation[]> {
  const all = read<Conversation>(KEYS.conversations, CONVERSATIONS);
  return tiny(
    all
      .filter((c) => c.clientId === clientId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  );
}

export async function getConversation(
  id: string,
): Promise<Conversation | undefined> {
  const all = read<Conversation>(KEYS.conversations, CONVERSATIONS);
  return tiny(all.find((c) => c.id === id));
}

/** All conversations for a customer, matched on the phone identity key. */
export async function listConversationsByPhone(
  clientId: string,
  phone: string,
): Promise<Conversation[]> {
  if (!phone) return tiny([]);
  const all = read<Conversation>(KEYS.conversations, CONVERSATIONS);
  return tiny(
    all
      .filter((c) => c.clientId === clientId && c.customerPhone === phone)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  );
}

export async function saveConversation(conv: Conversation): Promise<void> {
  const all = read<Conversation>(KEYS.conversations, CONVERSATIONS);
  const i = all.findIndex((c) => c.id === conv.id);
  if (i === -1) all.unshift(conv);
  else all[i] = conv;
  write(KEYS.conversations, all);
  return tiny(undefined);
}

// ---------------------------- Bookings ----------------------------

export async function listBookings(clientId: string): Promise<Booking[]> {
  const all = read<Booking>(KEYS.bookings, BOOKINGS);
  return tiny(
    all
      .filter((b) => b.clientId === clientId)
      .sort((a, b) => a.slotISO.localeCompare(b.slotISO)),
  );
}

export async function createBooking(booking: Booking): Promise<void> {
  const all = read<Booking>(KEYS.bookings, BOOKINGS);
  all.push(booking);
  write(KEYS.bookings, all);
  return tiny(undefined);
}

// ---------------------------- Knowledge ----------------------------

export async function listKnowledge(
  clientId: string,
): Promise<KnowledgeEntry[]> {
  const all = read<KnowledgeEntry>(KEYS.knowledge, KNOWLEDGE);
  return tiny(all.filter((k) => k.clientId === clientId));
}

export async function saveKnowledge(entry: KnowledgeEntry): Promise<void> {
  const all = read<KnowledgeEntry>(KEYS.knowledge, KNOWLEDGE);
  const i = all.findIndex((k) => k.id === entry.id);
  if (i === -1) all.push(entry);
  else all[i] = entry;
  write(KEYS.knowledge, all);
  return tiny(undefined);
}

export async function deleteKnowledge(id: string): Promise<void> {
  const all = read<KnowledgeEntry>(KEYS.knowledge, KNOWLEDGE);
  write(
    KEYS.knowledge,
    all.filter((k) => k.id !== id),
  );
  return tiny(undefined);
}

// ---------------------------- Rules ----------------------------

export async function getRules(clientId: string): Promise<AssistantRules> {
  const all = read<AssistantRules>(KEYS.rules, RULES);
  return tiny(all.find((r) => r.clientId === clientId) ?? RULES[0]);
}

export async function saveRules(rules: AssistantRules): Promise<void> {
  const all = read<AssistantRules>(KEYS.rules, RULES);
  const i = all.findIndex((r) => r.clientId === rules.clientId);
  if (i === -1) all.push(rules);
  else all[i] = rules;
  write(KEYS.rules, all);
  return tiny(undefined);
}

// ---------------------------- Availability ----------------------------

export async function getAvailability(
  clientId: string,
): Promise<Availability> {
  const all = read<Availability>(KEYS.availability, AVAILABILITY);
  return tiny(all.find((a) => a.clientId === clientId) ?? AVAILABILITY[0]);
}

export async function saveAvailability(av: Availability): Promise<void> {
  const all = read<Availability>(KEYS.availability, AVAILABILITY);
  const i = all.findIndex((a) => a.clientId === av.clientId);
  if (i === -1) all.push(av);
  else all[i] = av;
  write(KEYS.availability, all);
  return tiny(undefined);
}

// ---------------------------- Slot generation ----------------------------

/**
 * Turn weekly availability into the next `count` concrete upcoming slots.
 * Pure function — the brain uses it to offer real times.
 */
export function upcomingSlots(av: Availability, count = 4): string[] {
  const slots: string[] = [];
  const now = new Date();
  for (let d = 1; d <= 21 && slots.length < count; d++) {
    const day = new Date(now);
    day.setDate(now.getDate() + d);
    const times = av.days[day.getDay()];
    if (!times) continue;
    for (const t of times) {
      const [h, m] = t.split(":").map(Number);
      const slot = new Date(day);
      slot.setHours(h, m, 0, 0);
      slots.push(slot.toISOString());
      if (slots.length >= count) break;
    }
  }
  return slots;
}
