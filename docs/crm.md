# CRM — Leads

A **lead** is one person/deal. Leads arrive from the website contact form **or**
the AI web chat, deduped by [phone](./data-model.md#phone-is-the-identity-key-the-merge-key).

Pages: [`/leads`](../src/app/(app)/leads/page.tsx) (table) +
[`LeadDrawer`](../src/components/dashboard/LeadDrawer.tsx) (detail).

---

## Schema-driven custom fields

The CRM is **form-agnostic** — it must work for any client's contact form, not
just Rozalix's. So a lead is split into:

- **Core fields** — guaranteed for every client: `firstName`, `lastName`,
  `email`, `phone`, `message`. Search, dedupe, and "email this lead" rely on
  these always existing.
- **Custom fields** — a `fields: Record<string, FieldValue>` bag, described by
  the client's **`formSchema: FieldDef[]`**.

```ts
interface FieldDef {
  key: string;            // "budget"
  label: string;          // "Budget range"
  type: "text" | "textarea" | "number" | "select" | "date";
  options?: string[];     // for select
  inTable?: boolean;      // show as a column in the leads table
  filterable?: boolean;   // offer as a filter
}
```

One schema array drives **everything**: the live form on the client's site, the
**table columns** (`inTable`), the **filters** (`filterable`), and the
**lead-drawer** field rendering. Two demo clients prove it:

| | Rozalix (web studio) | Petal & Stem (florist) |
|---|---|---|
| Custom fields | Project type, Budget, Company | Event type, Event date, Guest count, Venue |
| Table columns | Project type · Budget | Event type · Event date · Guest count |

**Onboarding a client = add a `Client` + a `formSchema`. Zero component
changes.** In Neon this maps to `leads.fields jsonb` + the schema on the client
record.

> See [decisions.md → D3](./decisions.md).

---

## The pipeline

`New → Contacted → Qualified → Won → Lost`

| Status | Meaning | Set by |
|---|---|---|
| **New** | Arrived, no meaningful engagement yet | auto on arrival |
| **Contacted** | A real two-way conversation happened | you **or the AI** |
| **Qualified** | Confirmed real opportunity (need + fit) | you, or AI on "booked a call" |
| **Won** | Contract signed / deposit paid | you |
| **Lost** | Not proceeding | you (or AI if they clearly bow out) |

### Status is *pipeline reality*, not a to-do list

The single most important rule: **status answers "where is this deal?" — not
"what needs my attention?"** Attention is a *separate* signal (the red "Needs
you" badge + escalations). Conflating them is what makes pipelines confusing.

A lead can be **Contacted by AI** *and* flagged **Needs you** at the same time:
status says where it is, the badge says whether to act. No conflict.

### The AI advances the status

Because status = reality and the AI does real work, it moves the status
(implemented in `upsertLeadFromChat`):

- AI has a conversation → **Contacted**
- AI **books a call** → **Qualified**
- **Only ever advances, never downgrades**, and **never touches a won/lost
  lead** — so a real customer who chats again won't get knocked back.

You stay the gate for **Won** (signing) and **Lost**.

> See [decisions.md → D4](./decisions.md).

---

## Links to conversations

- **Table:** an aggregate live-chat flag — a chat icon on a row when the lead has
  an open thread (**red** if it needs you, grey if just active). Not a column —
  see [cardinality](./data-model.md#cardinality-matters-for-the-ui).
- **Drawer:** a **Conversations** section listing all of the lead's threads, each
  with its status badge + a jump link to `/conversations?c=<id>`.

---

## Customer summary & HOT signal

The lead drawer shows an AI **Customer summary** (score, tier, urgency,
estimated value, suggested action, and a chat recap if the customer has
chatted). The leads table shows a 🔥 **HOT** badge for high-scoring leads.
Full details — and how to cache the summary in production — in
[customer-summary.md](./customer-summary.md).
