# Customer summary & lead scoring

Two AI reads on a lead, both in [`src/lib/ai.ts`](../src/lib/ai.ts):

1. **`quickScore(lead, client)`** — a **cheap, synchronous** score → `{ score,
   tier }` (`hot` / `warm` / `cold`). Drives the 🔥 **HOT** badge on the leads
   table and the tier chip. Cheap enough to run per row.
2. **`analyzeLead(lead, client, conversations?)`** — the **narrative summary**
   (the expensive part in production): summary line, urgency, estimated value,
   suggested next action, and a **conversation recap** if the customer has
   chatted. Shown in the lead drawer as **"Customer summary."**

> The lead-drawer panel was formerly "AI Concierge" and also drafted replies.
> Once the [receptionist](./ai-receptionist.md) handles conversations, the
> draft-reply overlapped with it and was removed. The summary does **not**
> overlap — it's a cross-lead prioritization read, independent of any single
> conversation. See [decisions.md → D10](./decisions.md).

It's **conversation-aware**: the summary fuses *form data + chat recap + score*
into one snapshot, so it works whether the lead came via the form or the chat.

---

## Caching strategy (for the real backend)

The mock recomputes on every drawer open — fine with no cost. In production,
**don't** do that, and **don't** regenerate on every mutation either. Both pay
the wrong tax:

| Approach | Pays per | Why it's wrong |
|---|---|---|
| Summarize on every open | **view** | Views ≫ changes — 10 opens of an unchanged lead = 10 calls |
| Regenerate on every mutation | **mutation** | During a live chat *every message* is a mutation → a 30-message chat = 30 regenerations, mostly unseen |

### Recommended: materialized + lazy invalidation (stale-while-revalidate)

1. **Store** `summary_json`, `summary_input_hash`, `summary_updated_at` on the
   lead (columns), or a `lead_summaries` table if you want history / multiple
   summary types.
2. **On a relevant change, mark stale** — don't regenerate. Relevant = new
   customer message, status change, new field, booking. *Not* an owner note
   edit.
3. **On open, serve the stored summary instantly**, and if stale, regenerate in
   the **background** and swap it in (stale-while-revalidate → no spinner).
4. **Debounce during active chats** — regenerate when the conversation goes
   **idle** (AI finished its turn, customer stopped), or on
   booking/escalation/status-change. Summarize once when the dust settles, not
   per message.

This caps spend at **"once per meaningful change, and only if someone looks"** —
the smaller of the two taxes, never both.

### Two refinements

- **Split cheap vs expensive.** Keep `quickScore` (cheap, near-real-time on
  write) separate from the narrative summary (expensive, lazy). They already are
  in `ai.ts`.
- **Hash the inputs.** Key the cache on a hash of (lead fields + conversation
  state). Identical inputs → never regenerate; also prompt-cache-friendly.

### Real Claude call

`analyzeLead`'s reference impl uses **`claude-opus-4-8`** with **structured
output** (`output_config.format` + a JSON schema) so the result is typed and
parse-free. Runs server-side.

> See [decisions.md → D11](./decisions.md).
