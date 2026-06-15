# Architecture

## Big picture

```
  Client websites (rozalix-landing, …)
        │  contact form         │  web chat widget
        ▼                       ▼
  ┌─────────────────────────────────────────────────────────┐
  │                  Rozalix Console (this app)              │
  │                                                          │
  │   Auth ──▶ Workspace (active client) ──▶ scoped views    │
  │                                                          │
  │   CRM (Leads)   CMS (Content)   AI Receptionist          │
  │        └──────────────┬──────────────┘                   │
  │                  Data + AI layer  ◀── single swap point  │
  └──────────────────────────┬───────────────────────────────┘
                             ▼
        Now: localStorage        Later: Express API + Neon + Claude
```

The app is built so the **UI never knows** whether data comes from
`localStorage` or a real API. Everything goes through a thin async layer; today
those functions read/write `localStorage`, tomorrow they `fetch()` an Express
backend. Same signatures, same return types → **zero UI changes** on cutover.

---

## Multi-tenancy

- **Single shared dashboard.** One deployed app + one database serves every
  client. Onboard a client = add a `Client` record (+ a `formSchema` and
  assistant config). No new deploy.
- **Everything is `clientId`-scoped.** Every record (`Lead`, `ContentPage`,
  `Conversation`, `Booking`, knowledge, rules, availability) carries a
  `clientId`. Every query filters by the **active client**.
- **The "workspace" = the active client.** Provided by
  [`src/lib/client-context.tsx`](../src/lib/client-context.tsx)
  (`WorkspaceProvider` / `useWorkspace` / `useCurrentClient`). Switching the
  active client re-scopes every view.
- **Auth is client-only** (a real client sees just their own data). A Rozalix
  **super-admin** "logs in and selects an account" — getting the *same*
  single-tenant view, not an aggregated one. The sidebar account switcher is
  that flow; for a normal client it simply shows one account.

> See [decisions.md → D1, D2](./decisions.md).

---

## The data + AI layer (the swap points)

Four modules are the entire contract between the UI and "the backend." Each has
a mock body now and a documented real implementation for later.

| Module | Responsibility | Real implementation |
|---|---|---|
| [`src/lib/store.ts`](../src/lib/store.ts) | Clients, Leads, Content | `fetch()` Express routes |
| [`src/lib/assistant-store.ts`](../src/lib/assistant-store.ts) | Conversations, Bookings, Knowledge, Rules, Availability | `fetch()` Express routes |
| [`src/lib/ai.ts`](../src/lib/ai.ts) | Lead scoring + customer summary | Claude (structured output) |
| [`src/lib/assistant-brain.ts`](../src/lib/assistant-brain.ts) | The receptionist conversation engine | Claude tool-use loop |

**Conventions that make the swap clean:**

- Every accessor is **`async` and returns a Promise**, even though
  `localStorage` is synchronous — so adding network latency later changes
  nothing.
- The mock adds a small artificial delay so the UI exercises real loading
  states today.
- `ai.ts` / `assistant-brain.ts` end with a **commented, ready-to-paste Claude
  implementation** (model `claude-opus-4-8`).

> The AI must run **server-side only** — never ship an API key to the browser.
> That's why the static front-end deliberately does **not** depend on
> `@anthropic-ai/sdk`.

---

## Rendering model

- **Client-driven SPA.** Because data is local and auth is mock, the dashboard
  is built from **client components** (`"use client"`). Detail views use
  **slide-over panels and component state** rather than dynamic route segments,
  which keeps every route statically prerenderable and avoids Next 16's async
  `params`.
- **Deep links via query params** (`/leads?lead=<id>`, `/conversations?c=<id>`)
  open the relevant panel — pages that read `useSearchParams` are wrapped in
  `<Suspense>`.
- **Live updates via polling.** The inbox, bookings, leads flags, and nav badges
  poll their store every 2.5–3 s, so a chat started in the widget appears in the
  dashboard within seconds (and across tabs, since `localStorage` is shared).
  In production this becomes server push / websockets.

---

## Route map

```
/                         redirect → /login or /dashboard
/login                    mock auth
/chat-preview             PUBLIC — the customer-facing web chat widget

(app)/                    auth-guarded dashboard shell (sidebar + topbar)
  /dashboard              overview: stats, recent leads, content summary
  /leads                  CRM: schema-driven table + lead drawer
  /conversations          AI receptionist inbox (live)
  /bookings               calls the AI booked
  /assistant              receptionist config: Knowledge / Rules / Availability
  /content                CMS: page list + markdown editor
  /settings               account + website + form schema + demo reset
```

Navigation is configured in [`src/lib/nav.ts`](../src/lib/nav.ts).

---

## Source map

```
src/
├── app/
│   ├── layout.tsx              root: fonts + <AuthProvider>
│   ├── page.tsx                auth-aware redirect
│   ├── login/
│   ├── chat-preview/           public customer chat
│   └── (app)/                  dashboard route group (guarded shell)
│       ├── layout.tsx          auth guard + workspace + sidebar/topbar
│       ├── dashboard/ leads/ conversations/ bookings/ assistant/ content/ settings/
├── components/
│   ├── Logo.tsx
│   ├── ui/                     Button, Card, Field, Avatar, StatusBadge,
│   │                           EmptyState, ConfirmDialog
│   ├── dashboard/              Sidebar, Topbar, LeadDrawer
│   └── chat/                   ChatWidget
└── lib/
    ├── types.ts                core domain types (Client, Lead, …)
    ├── assistant-types.ts      receptionist types (Conversation, Booking, …)
    ├── seed.ts / assistant-seed.ts   demo data
    ├── store.ts / assistant-store.ts SWAP POINTS (data)
    ├── ai.ts / assistant-brain.ts    SWAP POINTS (AI)
    ├── auth.tsx                mock auth context
    ├── client-context.tsx      workspace (active client)
    ├── use-nav-badges.ts       live "needs attention" counts
    ├── nav.ts, format.ts, cn.ts, fonts.ts, markdown.tsx
```

---

## localStorage keys

Versioned so a seed-shape change forces a clean reseed. Bump the suffix when the
shape changes.

| Key | Holds |
|---|---|
| `rzx.leads.v3` | leads |
| `rzx.content.v2` | content pages |
| `rzx.conversations.v1` | conversations (messages embedded) |
| `rzx.bookings.v1` | bookings |
| `rzx.knowledge.v1` | knowledge base entries |
| `rzx.rules.v1` | assistant rules / persona |
| `rzx.availability.v1` | weekly availability |
| `rzx.session` | mock auth session |
| `rzx.activeClient` | active client id (account switcher) |

`Settings → Demo data → Reset` clears the data keys and reseeds.
