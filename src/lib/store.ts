import type { Lead, ContentPage, Client } from "./types";
import { CLIENTS, LEADS, CONTENT_PAGES } from "./seed";

// ============================================================
// Data store — the single swap point for the future backend.
//
// Today: reads/writes localStorage, seeded from seed.ts, with an
// artificial delay so the UI exercises real loading states.
//
// Later (Express + Neon): replace each function body with a
// `fetch("/api/...")` call. The signatures and return types stay
// identical, so no UI component needs to change.
// ============================================================

// Bump the version suffix whenever the seed shape changes so existing
// browsers re-seed instead of choking on stale records.
const KEYS = {
  leads: "rzx.leads.v2",
  content: "rzx.content.v2",
} as const;

const LATENCY = 250; // ms — simulates a network round-trip

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY));
}

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

function byNewest(a: { createdAt: string }, b: { createdAt: string }) {
  return b.createdAt.localeCompare(a.createdAt);
}

// ---------------------------- Clients ----------------------------

export async function getClient(clientId: string): Promise<Client | undefined> {
  return delay(CLIENTS.find((c) => c.id === clientId));
}

/**
 * Clients the user may open. In the demo we return all of them so the
 * account switcher can showcase multiple form schemas; in production this
 * is scoped to the user's access (one client for a client login, many for
 * a Rozalix super-admin).
 */
export async function listClients(): Promise<Client[]> {
  return delay(CLIENTS);
}

// ---------------------------- Leads (CRM) ----------------------------

export async function listLeads(clientId: string): Promise<Lead[]> {
  const all = read<Lead>(KEYS.leads, LEADS);
  return delay(all.filter((l) => l.clientId === clientId).sort(byNewest));
}

export async function updateLead(
  id: string,
  patch: Partial<Pick<Lead, "status" | "notes">>,
): Promise<Lead | undefined> {
  const all = read<Lead>(KEYS.leads, LEADS);
  const next = all.map((l) => (l.id === id ? { ...l, ...patch } : l));
  write(KEYS.leads, next);
  return delay(next.find((l) => l.id === id));
}

export async function deleteLead(id: string): Promise<void> {
  const all = read<Lead>(KEYS.leads, LEADS);
  write(
    KEYS.leads,
    all.filter((l) => l.id !== id),
  );
  return delay(undefined);
}

// ---------------------------- Content (CMS) ----------------------------

export async function listContent(clientId: string): Promise<ContentPage[]> {
  const all = read<ContentPage>(KEYS.content, CONTENT_PAGES);
  return delay(
    all
      .filter((p) => p.clientId === clientId)
      .sort((a, b) => a.title.localeCompare(b.title)),
  );
}

export async function getContent(
  clientId: string,
  slug: string,
): Promise<ContentPage | undefined> {
  const all = read<ContentPage>(KEYS.content, CONTENT_PAGES);
  return delay(all.find((p) => p.clientId === clientId && p.slug === slug));
}

export async function updateContent(
  id: string,
  patch: Partial<Pick<ContentPage, "title" | "body" | "status">>,
): Promise<ContentPage | undefined> {
  const all = read<ContentPage>(KEYS.content, CONTENT_PAGES);
  const stamp = new Date().toISOString();
  const next = all.map((p) =>
    p.id === id ? { ...p, ...patch, updatedAt: stamp } : p,
  );
  write(KEYS.content, next);
  return delay(next.find((p) => p.id === id));
}

/** Wipe local edits and re-seed — handy for demos. */
export function resetStore(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEYS.leads);
  window.localStorage.removeItem(KEYS.content);
}
