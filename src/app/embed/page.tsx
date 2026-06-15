"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChatWidget } from "@/components/chat/ChatWidget";

/**
 * Bare chat widget, no dashboard chrome — this is what the embed iframe loads.
 * `?key=<clientId>` selects the tenant. Served from our origin, so its
 * localStorage is shared with the dashboard (the demo's data bridge).
 */
function EmbedInner() {
  const key = useSearchParams().get("key") ?? "rozalix-landing";
  return (
    <div className="h-dvh w-full">
      <ChatWidget clientId={key} fill />
    </div>
  );
}

export default function EmbedPage() {
  return (
    <Suspense fallback={null}>
      <EmbedInner />
    </Suspense>
  );
}
