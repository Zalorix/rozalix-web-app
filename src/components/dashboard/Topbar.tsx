"use client";

import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { titleForPath, subtitleForPath } from "@/lib/nav";
import { useAuth } from "@/lib/auth";
import type { Client } from "@/lib/types";

export function Topbar({ client }: { client: Client | null }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const title = titleForPath(pathname);
  const subtitle = subtitleForPath(
    pathname,
    client?.name,
    user?.name?.split(" ")[0],
  );

  return (
    <header
      className="sticky top-0 z-20 flex min-h-16 shrink-0 items-center gap-3 border-b border-[var(--color-slate-200)] bg-white/85 px-4 py-2.5 backdrop-blur-md sm:px-6"
      // Clear the notch / status bar when installed as a PWA.
      style={{ paddingTop: "max(0.625rem, env(safe-area-inset-top))" }}
    >
      <div className="min-w-0">
        <h1 className="truncate text-[20px] leading-tight font-semibold tracking-[-0.01em] lg:text-[16px]">
          {title}
        </h1>
        {subtitle && (
          <p className="truncate text-[12px] leading-tight text-[var(--color-slate-500)]">
            {subtitle}
          </p>
        )}
      </div>

      {client && (
        <a
          href={`https://${client.domain}`}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 py-1.5 text-[13px] font-medium text-[var(--color-slate-500)] transition-colors hover:bg-[var(--color-slate-100)] hover:text-[var(--color-ink-900)]"
        >
          <ExternalLink className="size-4" />
          <span className="hidden sm:inline">View live site</span>
        </a>
      )}
    </header>
  );
}
