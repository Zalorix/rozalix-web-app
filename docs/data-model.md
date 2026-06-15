# Data model

All types live in [`src/lib/types.ts`](../src/lib/types.ts) (core) and
[`src/lib/assistant-types.ts`](../src/lib/assistant-types.ts) (receptionist).
Every record is scoped by `clientId`.

## Entities & relationships

```
Client ──1:N──▶ User
Client ──1:N──▶ Lead          (the person / deal)
Client ──1:N──▶ ContentPage   (CMS)
Client ──1:N──▶ Conversation  (a chat thread)
Client ──1:N──▶ Booking
Client ──1:1──▶ AssistantRules
Client ──1:1──▶ Availability
Client ──1:N──▶ KnowledgeEntry

Lead ──1:N──▶ Conversation     ← linked by PHONE, not a foreign key
Conversation ──1:1──▶ Lead      ← (the inverse)
Conversation ──0:1──▶ Booking
```

### Core records

| Type | Key fields |
|---|---|
| `Client` | `id`, `name`, `domain`, `initials`, `accent`, **`formSchema: FieldDef[]`** |
| `User` | `id`, `clientId`, `name`, `email`, `role` |
| `Lead` | core: `firstName/lastName/email/phone/message`, **`fields: Record<string, FieldValue>`**, `status`, `createdAt`, `notes` |
| `ContentPage` | `slug`, `title`, `body` (markdown), `status`, `updatedAt` |
| `Conversation` | `channel`, `customerName/Phone`, `status`, `assignee`, `stage`, `offeredSlots`, `messages: ChatMessage[]` |
| `Booking` | `conversationId`, `customerName/Phone`, `slotISO`, `summary`, `status` |
| `KnowledgeEntry` | `topic`, `keywords`, `answer` |
| `AssistantRules` | `greeting`, `persona`, `businessHours`, `neverDo[]`, `escalateKeywords[]`, `maxAiMessages` |
| `Availability` | `durationMins`, `days: Record<weekday, "HH:MM"[]>` |

---

## Phone is the identity key (the merge key)

A customer can reach a client through several channels — the contact form, the
web chat, later SMS and Messenger. We tie them together with **one canonical
identifier: the phone number.**

**Crucial nuance — phone is the *merge key*, not a *precondition*.** You can't
require a phone before the conversation starts:

| Channel | First-contact handle | Phone known up front? |
|---|---|---|
| SMS | the phone itself | ✅ yes |
| Web chat | anonymous browser session | ❌ collected mid-chat |
| Messenger (future) | page-scoped ID (PSID) | ❌ collected mid-chat |

So the model is: each channel hands you a **handle**; collecting the **phone**
early is the AI's first job; once known, every record (lead + conversations)
**stitches together on phone.**

### How the stitch works today

- The chat brain captures a phone from the visitor's messages
  (`extractPhone` in [`assistant-brain.ts`](../src/lib/assistant-brain.ts),
  normalizing PH `09…` → `+63…`).
- `upsertLeadFromChat` in [`store.ts`](../src/lib/store.ts) finds-or-creates the
  lead by `(clientId, phone)` — so the **contact form and the chat feed the same
  lead record**, no duplicates.
- Cross-links resolve by phone:
  `listConversationsByPhone(clientId, phone)` and a phone→lead map in the inbox.

### Cardinality matters for the UI

- **Conversation → lead is many-to-one.** A thread has exactly one lead → show a
  single pipeline pill + "view lead" link on the conversation.
- **Lead → conversation is one-to-many.** A lead may have several threads → the
  leads table shows an **aggregate** "has a live chat" flag; the lead drawer
  lists **all** threads. You can't put a single "conversation status" column on
  the leads table — there's no single value to show.

> See [decisions.md → D5, D8](./decisions.md).

### Edge cases (for the real backend)

Shared family phone, customer changes number, a web visitor who never gives a
number (stays a soft/pending lead). The future schema should use a
`customer_identities (customer_id, channel, handle)` table so multiple handles
map to one customer, with phone as the canonical one.
