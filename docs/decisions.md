# Decision log

The "why" behind the design. Each entry is a decision we made deliberately,
with the reasoning, so future changes don't accidentally undo it.

---

## D1 — Static now, swappable backend later

**Decision.** Build a fully interactive static prototype (localStorage + mock
AI), with every data/AI access behind an async layer that later becomes
`fetch()` / Claude calls. Target backend: **Next FE + Express BE + Neon DB**.

**Why.** Lets us demo and sell the whole product now with no infra/cost, while
guaranteeing the UI doesn't change on cutover. Accessors are `async` from day one
so latency changes nothing.

---

## D2 — Single shared, multi-tenant dashboard; client-only auth

**Decision.** One app + one DB serves all clients, scoped by `clientId`. A client
logs in and sees only their data. A super-admin "logs in as" a client and gets
the **same single-tenant view** — no aggregated/cross-client views.

**Why.** Maximum reuse (onboard = add a record). The agency won't show one
client another client's dashboard; the super-admin just needs to *be* a client
to support them, not see everything at once.

---

## D3 — Schema-driven leads (core fields + custom `fields` bag)

**Decision.** A lead = guaranteed **core** fields (name/email/phone/message) +
a `fields` bag described by the client's **`formSchema`**. The schema drives the
form, table columns, filters, and drawer.

**Why.** The CRM must fit *any* client's contact form. Hardcoding columns only
works for one client. Onboarding becomes "add a schema," and it maps to
`leads.fields jsonb` in Neon. `status` stays CRM-owned (never a form field) so
search/dedupe always work.

---

## D4 — Pipeline status = reality; the AI advances it

**Decision.** `New → Contacted → Qualified → Won → Lost`. The AI advances status
(conversation → Contacted, booked call → Qualified), **only forward**, **never
touching won/lost**. The human gates Won and Lost.

**Why.** Status should answer "where is this deal?", reflecting real progress —
including the AI's. Leaving an AI-contacted lead as "New" is misleading and
causes **double-contacting**. The "does it need me?" question is handled
separately (D6), so advancing status loses nothing.

---

## D5 — Phone is the merge key, not a precondition

**Decision.** One canonical identity = phone. But it's collected *during* the
conversation (web/Messenger don't have it up front), and records stitch together
on it once known.

**Why.** You can't gate first contact on a phone you don't have yet. The AI's
first job is to collect it; then the contact form and the chat feed **one** lead
(deduped by phone), and cross-channel context unifies. Future schema:
`customer_identities (customer_id, channel, handle)`.

---

## D6 — Attention is a separate signal from status (badges, not a bell)

**Decision.** "Needs you" / new-lead counts live as **nav badge counts**
([`use-nav-badges.ts`](../src/lib/use-nav-badges.ts)) — red for escalations,
grey for new leads — **not** as pipeline statuses and **not** as a notification
bell.

**Why.** Attention ≠ pipeline position; a lead at *any* stage can need you.
Badges sit on the destination, so the signal and the action are one click — no
"mark all read" chore. A bell earns its place only for signals that aren't
navigable surfaces. The *real* out-of-app notification (push/SMS to the owner's
phone) is a separate, later layer and the more important half.

---

## D7 — Client-driven SPA; panels & query-param deep links

**Decision.** Build from client components; detail views are slide-over panels /
component state, not dynamic route segments. Deep links use query params
(`?lead=`, `?c=`) with `<Suspense>`.

**Why.** Data is local + auth is mock, so server components buy little here.
Panels keep every route statically prerenderable and sidestep Next 16's async
`params`. Live updates come from short polling (becomes server push later).

---

## D8 — Conversation status ≠ pipeline status (different axes)

**Decision.** Conversations have their own status (`Active / Needs you / Booked /
Closed`); leads have the pipeline status. They are not merged. Cross-links honor
**cardinality**: conversation→lead is many-to-one (show one pipeline pill on the
thread); lead→conversation is one-to-many (aggregate flag on the table row, full
list in the drawer — **no** "conversation status" column).

**Why.** A lead can have many conversations over time → no single conversation
status fits a lead row. Each surface shows the other side at the altitude its
cardinality allows.

---

## D9 — Receptionist guardrails: hard rules in code, persona in the prompt

**Decision.** Hard rules (escalation triggers, max messages, only-real-slots,
only-KB-facts) enforced in code / tool handlers. Tone & persona in the system
prompt. The dashboard edits both.

**Why.** LLMs occasionally break hard constraints if you leave enforcement to
them. Putting hard rules in code makes them deterministic; the prompt handles the
soft stuff.

---

## D10 — Drop AI reply-drafting once the receptionist exists

**Decision.** The lead-drawer panel (formerly "AI Concierge") loses its
draft-reply feature and is renamed **"Customer summary."**

**Why.** Once the receptionist holds conversations, a manual reply draft
overlaps with it (the AI already replied). The *summary* doesn't overlap — it's a
cross-lead prioritization read. Reply automation for form-only leads belongs at
the receptionist level later (AI follow-up), not as a manual button.

---

## D11 — Cache the summary: materialized + lazy invalidation

**Decision.** Store the summary, mark it **stale** on relevant mutations,
regenerate **lazily** (stale-while-revalidate), and **debounce** during active
chats. Keep the cheap `quickScore` separate from the expensive narrative.

**Why.** Summarizing on every open pays per *view*; regenerating on every
mutation pays per *mutation* (a chat is a mutation storm). Lazy invalidation pays
**once per meaningful change, only if someone looks** — the smaller tax. Full
reasoning in [customer-summary.md](./customer-summary.md).

---

## Claude usage

- Default model **`claude-opus-4-8`** (server-side only — never expose a key to
  the browser; the static FE deliberately has no `@anthropic-ai/sdk` dependency).
- **Receptionist** = a tool-use loop (`collect_contact`, `offer_availability`,
  `book_call`, `escalate_to_human`); hard rules enforced in tool handlers.
- **Summary** = structured output (`output_config.format` + JSON schema).
- **Prompt caching** on the per-client system prompt + knowledge base (stable →
  cheap per-message cost).
