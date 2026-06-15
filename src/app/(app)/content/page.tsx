"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FileText, Check, Eye, Pencil, Globe } from "lucide-react";
import type { ContentPage, ContentStatus } from "@/lib/types";
import { useCurrentClient } from "@/lib/client-context";
import { listContent, updateContent } from "@/lib/store";
import { formatDateTime } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { ContentStatusBadge } from "@/components/ui/StatusBadge";
import { Spinner } from "@/components/ui/EmptyState";

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
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
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
          <Card className="flex items-center justify-center py-20 text-sm text-[var(--color-slate-400)]">
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
  const [tab, setTab] = useState<"edit" | "preview">("edit");
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
    <Card className="overflow-hidden">
      {/* Editor header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--color-slate-100)] px-5 py-4">
        <div className="min-w-0 flex-1">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-0 px-0 text-lg font-semibold focus:ring-0 focus:shadow-none"
          />
          <p className="mt-0.5 text-[12px] text-[var(--color-slate-400)]">
            Last updated {formatDateTime(page.updatedAt)}
          </p>
        </div>
        <ContentStatusBadge status={status} />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-slate-100)] bg-[var(--color-slate-50)] px-5 py-2.5">
        <div className="flex rounded-[var(--radius-md)] border border-[var(--color-slate-200)] bg-white p-0.5">
          <TabBtn active={tab === "edit"} onClick={() => setTab("edit")}>
            <Pencil className="size-3.5" /> Edit
          </TabBtn>
          <TabBtn active={tab === "preview"} onClick={() => setTab("preview")}>
            <Eye className="size-3.5" /> Preview
          </TabBtn>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-[var(--color-slate-600)]">
          <Globe className="size-4 text-[var(--color-slate-400)]" />
          Published
          <button
            type="button"
            role="switch"
            aria-checked={status === "published"}
            onClick={() =>
              setStatus((s) => (s === "published" ? "draft" : "published"))
            }
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
          </button>
        </label>
      </div>

      {/* Body */}
      <div className="px-5 py-5">
        {tab === "edit" ? (
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={20}
            className="font-[var(--font-mono)] text-[13px] leading-relaxed"
            placeholder="Write in markdown…"
          />
        ) : (
          <div className="min-h-[300px] rounded-[var(--radius-md)] border border-[var(--color-slate-200)] px-5 py-4">
            <h1 className="mb-2 text-2xl font-semibold">{title}</h1>
            {renderMarkdown(body)}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-[var(--color-slate-100)] px-5 py-4">
        {dirty && !savedFlash && (
          <span className="mr-auto text-[13px] text-[var(--color-slate-400)]">
            Unsaved changes
          </span>
        )}
        <Button onClick={save} disabled={saving || !dirty}>
          {savedFlash ? (
            <>
              <Check className="size-4" /> Saved
            </>
          ) : saving ? (
            <Spinner />
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </Card>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[13px] font-medium transition-colors",
        active
          ? "bg-[var(--color-indigo-50)] text-[var(--color-indigo-deeper)]"
          : "text-[var(--color-slate-500)] hover:text-[var(--color-ink-900)]",
      )}
    >
      {children}
    </button>
  );
}
