"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { titleForPath, subtitleForPath, greeting } from "@/lib/nav";
import { useAuth } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import type { Client } from "@/lib/types";

export function Topbar({ client }: { client: Client | null }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0];
  const title = titleForPath(pathname);
  const subtitle = subtitleForPath(pathname, client?.name, firstName);

  const isHome = pathname === "/dashboard";
  // On mobile, Home gets a branded greeting; every other screen a big title.
  const mobileTitle = isHome
    ? `${greeting()}${firstName ? `, ${firstName}` : ""}`
    : title;
  const mobileSubtitle = isHome
    ? "Here's the latest from your AI receptionist."
    : subtitle;

  return (
    <header
      className="sticky top-0 z-20 flex min-h-16 shrink-0 items-center gap-3 border-b border-[var(--color-slate-200)] bg-white/85 px-4 py-2.5 backdrop-blur-md sm:px-6"
      // Clear the notch / status bar when installed as a PWA.
      style={{ paddingTop: "max(0.625rem, env(safe-area-inset-top))" }}
    >
      {/* Mobile: native large-title header */}
      <div className="min-w-0 flex-1 lg:hidden">
        {isHome && client?.domain && (
          <p className="truncate text-[11px] font-semibold tracking-[0.04em] text-[var(--color-indigo-400)] uppercase">
            {client.domain}
          </p>
        )}
        <h1 className="truncate text-[23px] leading-tight font-bold tracking-[-0.02em]">
          {mobileTitle}
        </h1>
        {mobileSubtitle && (
          <p className="truncate text-[12.5px] leading-tight text-[var(--color-slate-500)]">
            {mobileSubtitle}
          </p>
        )}
      </div>

      {/* Desktop: compact title + subtitle (the sidebar carries identity) */}
      <div className="hidden min-w-0 flex-1 lg:block">
        <h1 className="truncate text-[16px] leading-tight font-semibold">
          {title}
        </h1>
        {subtitle && (
          <p className="truncate text-[12px] leading-tight text-[var(--color-slate-500)]">
            {subtitle}
          </p>
        )}
      </div>

      <div className="ml-auto shrink-0">
        {client && (
          <a
            href={`https://${client.domain}`}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 py-1.5 text-[13px] font-medium text-[var(--color-slate-500)] transition-colors hover:bg-[var(--color-slate-100)] hover:text-[var(--color-ink-900)] lg:inline-flex"
          >
            <ExternalLink className="size-4" />
            View live site
          </a>
        )}
        {/* Mobile: account avatar → More */}
        <Link href="/more" aria-label="Account" className="lg:hidden">
          <Avatar
            size="sm"
            initials={client?.initials ?? "··"}
            accent={client?.accent}
            image={client?.logo}
          />
        </Link>
      </div>
    </header>
  );
}
