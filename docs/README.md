# Rozalix Console — Documentation

The **Rozalix Console** is the client dashboard that ships with every website
Rozalix builds. One website = one client = one tenant, and each tenant gets a
**CRM**, a **CMS**, and an **AI receptionist** that handles conversations,
books calls, and feeds the CRM.

This is the reusable product: onboard a new client by adding a record, not by
building a new app.

---

## Status

- **Now:** a fully interactive **static prototype**. No backend, no API keys.
  All data lives in `localStorage`, seeded from `src/lib/*-seed.ts`. The AI is a
  deterministic **mock** shaped exactly like the real Claude calls.
- **Later:** a **Next.js front-end + Express back-end + Neon (Postgres)**
  database, with the AI running server-side on **Claude (`claude-opus-4-8`)**.
  Every data/AI module is a single **swap point** — replace the mock body with a
  `fetch()` / Claude call and the UI is unchanged. See
  [backend.md](./backend.md).

---

## Documentation index

| Doc | What's in it |
|---|---|
| [architecture.md](./architecture.md) | System design: multi-tenancy, the data/swap layer, rendering model, file map, storage keys |
| [data-model.md](./data-model.md) | Every entity, how they relate, and the phone-as-identity model |
| [crm.md](./crm.md) | Leads, schema-driven custom fields, the pipeline & status rules, AI auto-advance |
| [cms.md](./cms.md) | Editable content pages (Terms, Privacy, …) |
| [ai-receptionist.md](./ai-receptionist.md) | The receptionist: brain, guardrails, booking, channel roadmap, Claude integration |
| [customer-summary.md](./customer-summary.md) | Lead scoring + the customer summary, and how to cache it |
| [decisions.md](./decisions.md) | The decision log — every "why" behind the design |
| [backend.md](./backend.md) | Express/Neon implementation plan + the swap-point checklist |

---

## Quick start

```bash
cd rozalix-web-app
npm install
npm run dev      # http://localhost:3000
```

**Demo login** (prefilled): `demo@rozalix.com` / `rozalix`.

Two seeded clients with deliberately different contact forms prove the
multi-tenant design — switch between them in the sidebar:

- **Rozalix** (web studio) — fields: project type, budget, company
- **Petal & Stem** (florist) — fields: event type, event date, guest count, venue

---

## The 2-minute demo script

1. Open **`/chat-preview`** in one tab (the customer's view) and **`/conversations`**
   in another (your inbox).
2. In the chat, ask *"How much for a new website?"* → it answers from the
   knowledge base → asks for your name + number → offers **real availability
   slots** → books the call.
3. Watch the thread appear live in **Conversations** and the booking in
   **Bookings**. A **lead** is created/advanced in **Leads** (Contacted →
   Qualified), keyed by phone.
4. Hit **Take over** in the inbox and type — your message shows up live in the
   customer's widget and the AI goes silent.
5. Try *"I want to talk to a human"* → the thread flags **Needs you** (red badge
   on the Conversations nav item).

---

## Tech stack

- **Next.js 16** (App Router, React 19, TypeScript), **Tailwind CSS v4**
- **lucide-react** icons
- Branding mirrors `rozalix-landing` (indigo/violet, Space Grotesk + Inter)
- Future backend: **Express + Neon (Postgres)**, **Claude `claude-opus-4-8`**
