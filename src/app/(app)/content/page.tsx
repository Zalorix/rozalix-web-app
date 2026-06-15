"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { FileText, Check, Globe } from "lucide-react";
import type { ContentPage, ContentStatus } from "@/lib/types";
import { useCurrentClient } from "@/lib/client-context";
import { listContent, updateContent } from "@/lib/store";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/EmptyState";

// The block editor is client-only (touches the DOM) and heavy, so it's loaded
// on demand and never server-rendered.
const BlockEditor = dynamic(
  () => import("@/components/content/BlockEditor").then((m) => m.BlockEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    ),
  },
);

export default function ContentRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      }
    >
      <ContentManager />
    </Suspense>
  );
}

function ContentManager() {
  const client = useCurrentClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [pages, setPages] = useState<ContentPage[] | null>(null);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  function refresh() {
    if (client) return listContent(client.id).then(setPages);
    return Promise.resolve();
  }

  useEffect(() => {
    setPages(null);
    setActiveSlug(null);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client?.id]);

  // Sync selection from ?slug= (deep links from the overview).
  useEffect(() => {
    if (!pages) return;
    const fromUrl = searchParams.get("slug");
    if (fromUrl && pages.some((p) => p.slug === fromUrl)) {
      setActiveSlug(fromUrl);
    } else if (!activeSlug && pages[0]) {
      setActiveSlug(pages[0].slug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, searchParams]);

  const active = pages?.find((p) => p.slug === activeSlug) ?? null;

  function select(slug: string) {
    setActiveSlug(slug);
    router.replace(`/content?slug=${slug}`);
  }

  return (
    // Mobile: the whole page scrolls (the editor grows). Desktop: fixed-shell
    // where the editor pane scrolls on its own.
    <div className="flex flex-col lg:min-h-0 lg:flex-1">
      <div className="grid gap-5 lg:min-h-0 lg:flex-1 lg:grid-cols-[260px_1fr] lg:grid-rows-1">
        {/* Page list */}
        <Card className="h-max overflow-hidden">
          <div className="border-b border-[var(--color-slate-100)] px-4 py-3 text-[12px] font-semibold tracking-wide text-[var(--color-slate-400)] uppercase">
            Pages
          </div>
          {pages === null ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : (
            <ul className="p-2">
              {pages.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => select(p.slug)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left transition-colors",
                      p.slug === activeSlug
                        ? "bg-[var(--color-indigo-50)]"
                        : "hover:bg-[var(--color-slate-50)]",
                    )}
                  >
                    <FileText
                      className={cn(
                        "size-[18px] shrink-0",
                        p.slug === activeSlug
                          ? "text-[var(--color-indigo)]"
                          : "text-[var(--color-slate-400)]",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {p.title}
                      </span>
                      <span className="block truncate font-[var(--font-mono)] text-[11px] text-[var(--color-slate-400)]">
                        /{p.slug}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Editor */}
        {active ? (
          <Editor key={active.id} page={active} onSaved={refresh} />
        ) : (
          <Card className="flex min-h-0 items-center justify-center py-20 text-sm text-[var(--color-slate-400)]">
            Select a page to edit
          </Card>
        )}
      </div>
    </div>
  );
}

function Editor({
  page,
  onSaved,
}: {
  page: ContentPage;
  onSaved: () => Promise<void> | void;
}) {
  const [title, setTitle] = useState(page.title);
  const [body, setBody] = useState(page.body);
  const [status, setStatus] = useState<ContentStatus>(page.status);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const dirty = useMemo(
    () => title !== page.title || body !== page.body || status !== page.status,
    [title, body, status, page],
  );

  async function save() {
    setSaving(true);
    await updateContent(page.id, { title, body, status });
    await onSaved();
    setSaving(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  }

  return (
    <Card className="flex min-h-0 flex-col overflow-hidden">
      {/* Single action bar: title + meta on the left, publish + save on the
          right. Everything else is editing real estate. */}
      <div className="flex items-center gap-3 border-b border-[var(--color-slate-100)] px-4 py-2.5">
        <div className="min-w-0 flex-1">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-0 px-0 text-[15px] font-semibold focus:shadow-none focus:ring-0"
          />
          <p className="px-0 text-[11.5px] text-[var(--color-slate-400)]">
            {dirty ? "Unsaved changes" : `Updated ${formatDateTime(page.updatedAt)}`}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={status === "published"}
          onClick={() =>
            setStatus((s) => (s === "published" ? "draft" : "published"))
          }
          title={status === "published" ? "Published" : "Draft"}
          className="flex shrink-0 items-center gap-2 text-[13px] font-medium text-[var(--color-slate-600)]"
        >
          <Globe className="size-4 text-[var(--color-slate-400)]" />
          <span className="hidden sm:inline">
            {status === "published" ? "Published" : "Draft"}
          </span>
          <span
            className={cn(
              "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
              status === "published"
                ? "bg-[var(--color-indigo)]"
                : "bg-[var(--color-slate-300)]",
            )}
          >
            <span
              className={cn(
                "inline-block size-4 rounded-full bg-white transition-transform",
                status === "published" ? "translate-x-4" : "translate-x-0.5",
              )}
            />
          </span>
        </button>

        <Button size="sm" onClick={save} disabled={saving || (!dirty && !savedFlash)}>
          {savedFlash ? (
            <>
              <Check className="size-4" /> Saved
            </>
          ) : saving ? (
            <Spinner />
          ) : (
            "Save"
          )}
        </Button>
      </div>

      {/* Body — Notion-style block editor; fills the whole card (no inner box).
          Mobile: grows with content (the page scrolls). Desktop: fills the pane
          and scrolls on its own. Slash/format menus float to the cursor. */}
      <div className="rzx-content-editor scroll-slim min-h-[55vh] py-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        <BlockEditor initialMarkdown={page.body} onChange={setBody} />
      </div>
    </Card>
  );
}
