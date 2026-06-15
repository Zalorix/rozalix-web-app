# Backend plan (Express + Neon + Claude)

The static prototype is built so the backend slots in behind it. This is the
plan and the swap-point checklist.

## Shape

```
Next.js front-end (this app)
   │  fetch()  (replaces the localStorage bodies)
   ▼
Express API ──▶ Neon (Postgres)
   │
   └─▶ Claude (claude-opus-4-8)   ← server-side ONLY
        ├─ receptionist tool-use loop
        └─ lead summary (structured output)
```

> **The Claude API key never leaves the server.** The front-end calls *your*
> Express routes; Express calls Claude.

## Swap points (the only files that change)

| File | Today | Replace with |
|---|---|---|
| [`src/lib/store.ts`](../src/lib/store.ts) | localStorage | `fetch()` clients/leads/content routes |
| [`src/lib/assistant-store.ts`](../src/lib/assistant-store.ts) | localStorage | `fetch()` conversations/bookings/KB/rules/availability routes |
| [`src/lib/ai.ts`](../src/lib/ai.ts) | mock heuristic | `fetch()` → Express → Claude summary |
| [`src/lib/assistant-brain.ts`](../src/lib/assistant-brain.ts) | mock state machine | `fetch()` → Express → Claude tool-use loop |

Function signatures and return types stay identical → **no UI changes**.

## Suggested Neon schema

```sql
clients          (id, name, domain, initials, accent, form_schema jsonb)
users            (id, client_id, name, email, role)

leads            (id, client_id, first_name, last_name, email, phone,
                  message, fields jsonb, status, notes, created_at,
                  -- summary cache (see customer-summary.md)
                  summary_json jsonb, summary_input_hash text,
                  summary_updated_at timestamptz)

content_pages    (id, client_id, slug, title, body, status, updated_at)

customers           (id, client_id, name, phone)         -- phone = canonical id
customer_identities (customer_id, channel, handle)       -- web session / PSID / phone

conversations    (id, client_id, customer_id, channel, status, assignee,
                  stage, offered_slots jsonb, created_at, updated_at)
messages         (id, conversation_id, role, text, created_at)

bookings         (id, client_id, conversation_id, customer_id, slot, summary,
                  status, created_at)

knowledge        (id, client_id, topic, keywords text[], answer)
assistant_rules  (client_id, greeting, persona, business_hours,
                  never_do text[], escalate_keywords text[], max_ai_messages)
availability     (client_id, duration_mins, days jsonb)
```

Index `leads (client_id, phone)` and `conversations (client_id, customer_phone)`
— the [phone identity](./data-model.md#phone-is-the-identity-key-the-merge-key)
joins depend on them.

## Build order (mirrors the prototype phases)

1. **CRM + CMS API** — clients/leads/content CRUD. Cut `store.ts` over to it.
2. **Receptionist ingest** — a webhook/route the client's chat widget POSTs to;
   persist conversations/messages; run the Claude tool-use loop server-side; emit
   bookings; `upsertLeadFromChat` logic in SQL (advance-only).
3. **Summary service** — the lazy, materialized cache from
   [customer-summary.md](./customer-summary.md). Mark-stale on relevant
   mutations; regenerate on read / at settle points.
4. **Real-time** — replace polling with server push (SSE/websocket) for the
   inbox + nav badges; add **owner notifications** (push/SMS) for
   escalations/bookings — the out-of-app half of [D6](./decisions.md#d6).
5. **More channels** — SMS (Twilio), Messenger adapters feeding the same brain.

## Claude integration notes

- Model **`claude-opus-4-8`**.
- **Receptionist:** tool-use loop. Tools (`collect_contact`,
  `offer_availability`, `book_call`, `escalate_to_human`) are where the **hard
  guardrails** live — the model proposes, the handlers enforce (business hours,
  max messages, only-real-slots, only-KB-facts).
- **Summary:** structured output (`output_config.format` + JSON schema) → typed,
  parse-free result.
- **Prompt caching:** the per-client system prompt + knowledge base is stable —
  cache it so each inbound message only pays for the new tokens.
- Reference implementations are in the comment blocks at the bottom of
  [`ai.ts`](../src/lib/ai.ts) and [`assistant-brain.ts`](../src/lib/assistant-brain.ts).
