# CMS — Content

The CMS lets a client edit the pages on their live site (Terms, Privacy, and any
other page) without touching code — instead of the content being hardcoded in
the website's JSX.

Page: [`/content`](../src/app/(app)/content/page.tsx).

## Model

```ts
interface ContentPage {
  id: string;
  clientId: string;
  slug: string;          // URL slug on the live site, e.g. "terms"
  title: string;
  body: string;          // markdown
  status: "draft" | "published";
  updatedAt: string;
}
```

The client's website reads the **published** `body` for each `slug` instead of
hardcoding it. (In the static demo the pages are seeded; in production the
website fetches them, or they're injected at build/ISR time.)

## Editor

A two-pane editor: a list of pages on the left, an editor on the right with:

- title + slug
- a **draft ↔ published** toggle
- a markdown body with **Edit / Preview** tabs (rendered by
  [`src/lib/markdown.tsx`](../src/lib/markdown.tsx) — a tiny dependency-free
  renderer supporting `##`/`###` headings, `-` lists, and `**bold**` / `_italic_`)
- "last updated" stamps

Deep link: `/content?slug=<slug>` opens a specific page (used by the overview).

## Future direction

The CMS is the natural home for the **AI receptionist's knowledge base** too —
both are "client-editable content." The receptionist's
[knowledge entries](./ai-receptionist.md#knowledge-base--grounding) could become
a content type here, so a client edits their FAQs/pricing in one place and the
AI is grounded in it.
