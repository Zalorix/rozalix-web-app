"use client";

import { usePathname } from "next/navigation";
import { Menu, ExternalLink } from "lucide-react";
import { titleForPath, subtitleForPath } from "@/lib/nav";
import { useAuth } from "@/lib/auth";
import type { Client } from "@/lib/types";

export function Topbar({
  client,
  onMenu,
}: {
  client: Client | null;
  onMenu: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const title = titleForPath(pathname);
  const subtitle = subtitleForPath(
    pathname,
    client?.name,
    user?.name?.split(" ")[0],
  );

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-[var(--color-slate-200)] bg-white/85 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        onClick={onMenu}
        className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-slate-500)] hover:bg-[var(--color-slate-100)] lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      <div className="min-w-0">
        <h1 className="truncate text-[16px] leading-tight font-semibold">
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
