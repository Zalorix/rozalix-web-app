# AI Receptionist

The competitive edge: instead of just *capturing* leads, the AI **holds the
conversation**, answers from the client's knowledge base, qualifies the visitor,
collects a phone, **books a call**, and **escalates to the owner** when stuck.
Speed-to-lead is the biggest SMB conversion lever — the AI replies in seconds,
even when the owner is busy.

**Phase 1 (built): web chat.** SMS and Messenger come later (same brain, new
adapters).

## Pieces

| Piece | File |
|---|---|
| Customer-facing widget | [`src/components/chat/ChatWidget.tsx`](../src/components/chat/ChatWidget.tsx) |
| Public preview page | [`/chat-preview`](../src/app/chat-preview/page.tsx) |
| The brain (mock + Claude reference) | [`src/lib/assistant-brain.ts`](../src/lib/assistant-brain.ts) |
| Inbox (live) | [`/conversations`](../src/app/(app)/conversations/page.tsx) |
| Bookings | [`/bookings`](../src/app/(app)/bookings/page.tsx) |
| Config (Knowledge / Rules / Availability) | [`/assistant`](../src/app/(app)/assistant/page.tsx) |
| Store (conversations, bookings, KB, rules, availability) | [`src/lib/assistant-store.ts`](../src/lib/assistant-store.ts) |

## The conversation flow

```
greet → answer from KB → qualify → collect name + phone →
offer real availability slots → book → confirm → notify owner
                 └─ escalate to owner if: stuck, off-KB, or "talk to a human"
```

A web visitor starts as a **pending** lead and becomes a real customer the
moment they share a phone (the [merge key](./data-model.md#phone-is-the-identity-key-the-merge-key)).

The brain returns, per inbound message, an `AiTurn`: reply bubbles + a patch to
the conversation (+ an optional booking). Stage machine:
`greeting → discovery → awaiting_contact → awaiting_slot → booked / escalated`.

## Guardrails: hard rules in code, persona in the prompt

The single most important design rule. **Don't ask the LLM to enforce hard
rules — it will occasionally break them.**

- **Hard rules — enforced in code** (the "rules engine"): escalation triggers,
  max-AI-messages before handoff, "only offer real availability slots", "answer
  only from the knowledge base / never invent a price."
- **Soft guidance — in the system prompt**: tone, persona, how to ask qualifying
  questions.

The dashboard's **Rules** tab edits both; code enforces the hard ones.

> See [decisions.md → D9](./decisions.md).

## Knowledge base & grounding

Per-client `KnowledgeEntry[]` (topic + keywords + answer). The AI answers
**strictly** from these facts. If a question isn't covered, it **asks or offers
a call** rather than guessing — this is what prevents hallucinated prices.

## Booking

The owner sets **weekly availability slots** in the dashboard (`Availability`
tab). `upcomingSlots()` turns that into the next concrete bookable times, which
the AI offers. Booking a slot creates a `Booking`, sets the conversation to
`booked`, and advances the linked lead to **Qualified**. (Upgrade path: real
Google Calendar sync.)

## Autonomy & handoff

Autonomous until **booked or stuck**. The owner can **take over** any live thread
from the inbox (sets `assignee = "owner"`; the AI goes silent for that thread —
the widget polls and respects it). Escalations flag the thread **Needs you** (red
badge on the Conversations nav item).

## Channel roadmap

| Phase | Channel | Notes |
|---|---|---|
| 1 ✅ | Web chat | Built. Easiest to control/test, no third-party approval. |
| 2 | SMS (Twilio) | Phone-native → simplest identity. Needs opt-in / STOP handling. |
| 3 | Messenger | Meta API; PSID handle; 24-hour messaging window policy. |
| 4 | Cross-channel rolling context | Merge threads by phone for one unified history. |

Each phase reuses the same brain; you add a **channel adapter** (normalize
inbound/outbound, verify webhooks) — not a new AI.

## Real Claude integration (the swap)

`assistant-brain.ts` ends with a documented, ready-to-paste implementation
(server-side only):

- Model **`claude-opus-4-8`**, a **tool-use loop** with tools:
  `collect_contact`, `offer_availability`, `book_call`, `escalate_to_human`.
  Tools = deterministic, guardrailed actions (the tool *handlers* enforce the
  hard rules; the model just decides which to call).
- System prompt = persona + business hours + the **never-do** list + the
  knowledge base. The KB is stable per client → mark it with **prompt caching**
  so every inbound message is cheap (only the new message is uncached).

> See [backend.md](./backend.md) for the full server plan, and
> [the Anthropic notes](./decisions.md#claude-usage) for model/usage choices.
