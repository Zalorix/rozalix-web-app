"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { Spinner } from "@/components/ui/EmptyState";

export default function ChatPreviewRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <ChatPreview />
    </Suspense>
  );
}

const CLIENTS = [
  { id: "rozalix-landing", name: "Rozalix" },
  { id: "petal-and-stem", name: "Petal & Stem" },
];

function ChatPreview() {
  const params = useSearchParams();
  const clientId =
    params.get("client") && CLIENTS.some((c) => c.id === params.get("client"))
      ? (params.get("client") as string)
      : "rozalix-landing";

  return (
    <div className="h-dvh overflow-y-auto bg-[var(--color-slate-100)]">
      {/* Faux site chrome to frame the widget as an embed */}
      <div className="border-b border-[var(--color-slate-200)] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-sm font-medium text-[var(--color-slate-500)]">
            Preview — this is the chat your customers see on the live site
          </span>
          <div className="flex gap-1.5">
            {CLIENTS.map((c) => (
              <Link
                key={c.id}
                href={`/chat-preview?client=${c.id}`}
                className={
                  c.id === clientId
                    ? "rounded-[var(--radius-pill)] bg-[var(--color-indigo-50)] px-3 py-1.5 text-[13px] font-semibold text-[var(--color-indigo-deeper)]"
                    : "rounded-[var(--radius-pill)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-slate-500)] hover:bg-[var(--color-slate-100)]"
                }
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 py-12">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Try the AI receptionist</h1>
          <p className="mt-2 text-sm text-[var(--color-slate-500)]">
            Ask about pricing or services, then let it book you a call. Every
            message appears live in the dashboard&apos;s{" "}
            <Link
              href="/conversations"
              className="font-medium text-[var(--color-indigo)] hover:underline"
            >
              Conversations
            </Link>{" "}
            inbox — open it in another tab to watch.
          </p>
        </div>

        <ChatWidget key={clientId} clientId={clientId} />
      </div>
    </div>
  );
}
