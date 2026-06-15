"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsUpDown, LogOut, Check, Settings } from "lucide-react";
import { cn } from "@/lib/cn";
import { NAV_ITEMS, SETTINGS_ITEM } from "@/lib/nav";
import { useAuth } from "@/lib/auth";
import { useWorkspace } from "@/lib/client-context";
import { useNavBadges } from "@/lib/use-nav-badges";
import { Avatar } from "@/components/ui/Avatar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { client, clients, setActiveClientId } = useWorkspace();
  const badges = useNavBadges();

  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);
  const multi = clients.length > 1;

  // Close the switcher on outside click.
  useEffect(() => {
    if (!switcherOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!switcherRef.current?.contains(e.target as Node))
        setSwitcherOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [switcherOpen]);

  return (
    <div className="flex h-full w-[var(--sidebar-w)] flex-col border-r border-[var(--color-slate-200)] bg-white">
      {/* Client switcher — one option for a client login, many for super-admin */}
      <div ref={switcherRef} className="relative px-3 pt-4">
        <button
          type="button"
          onClick={() => multi && setSwitcherOpen((o) => !o)}
          title={multi ? "Switch account" : undefined}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-slate-200)] bg-[var(--color-slate-50)] px-3 py-2.5 text-left transition-colors",
            multi
              ? "cursor-pointer hover:border-[var(--color-slate-300)]"
              : "cursor-default",
          )}
        >
          <Avatar
            size="sm"
            initials={client?.initials ?? "··"}
            accent={client?.accent}
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold">
              {client?.name ?? "Loading…"}
            </span>
            <span className="block truncate text-[11px] text-[var(--color-slate-400)]">
              {client?.domain ?? ""}
            </span>
          </span>
          {multi && (
            <ChevronsUpDown className="size-4 shrink-0 text-[var(--color-slate-400)]" />
          )}
        </button>

        {switcherOpen && (
          <div className="absolute inset-x-3 top-full z-30 mt-1.5 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-slate-200)] bg-white py-1 shadow-[var(--shadow-lift)]">
            <p className="px-3 py-1.5 text-[11px] font-semibold tracking-wide text-[var(--color-slate-400)] uppercase">
              Accounts
            </p>
            {clients.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setActiveClientId(c.id);
                  setSwitcherOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[var(--color-slate-50)]"
              >
                <Avatar size="sm" initials={c.initials} accent={c.accent} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">
                    {c.name}
                  </span>
                  <span className="block truncate text-[11px] text-[var(--color-slate-400)]">
                    {c.domain}
                  </span>
                </span>
                {c.id === client?.id && (
                  <Check className="size-4 shrink-0 text-[var(--color-indigo)]" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="mt-4 flex flex-1 flex-col gap-0.5 px-3">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const badge = badges[item.href];
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--color-indigo-50)] text-[var(--color-indigo-deeper)]"
                  : "text-[var(--color-slate-600)] hover:bg-[var(--color-slate-100)] hover:text-[var(--color-ink-900)]",
              )}
            >
              <Icon
                className={cn(
                  "size-[18px]",
                  active
                    ? "text-[var(--color-indigo)]"
                    : "text-[var(--color-slate-400)]",
                )}
              />
              {item.label}
              {badge && badge.count > 0 && (
                <span
                  className={cn(
                    "ml-auto inline-flex min-w-5 items-center justify-center rounded-[var(--radius-pill)] px-1.5 text-[11px] font-bold",
                    badge.urgent
                      ? "bg-[var(--color-error)] text-white"
                      : "bg-[var(--color-slate-200)] text-[var(--color-slate-600)]",
                  )}
                >
                  {badge.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-[var(--color-slate-100)] p-3">
        <div className="flex items-center gap-2.5 px-1 py-1.5">
          <Avatar
            size="sm"
            initials={(user?.name ?? "?")
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold">
              {user?.name}
            </span>
            <span className="block truncate text-[11px] text-[var(--color-slate-400)]">
              {user?.email}
            </span>
          </span>
          <Link
            href={SETTINGS_ITEM.href}
            onClick={onNavigate}
            title="Settings"
            className={cn(
              "flex size-8 items-center justify-center rounded-[var(--radius-md)] transition-colors",
              pathname === SETTINGS_ITEM.href
                ? "bg-[var(--color-indigo-50)] text-[var(--color-indigo)]"
                : "text-[var(--color-slate-400)] hover:bg-[var(--color-slate-100)] hover:text-[var(--color-ink-900)]",
            )}
          >
            <Settings className="size-[18px]" />
          </Link>
          <button
            type="button"
            onClick={() => setConfirmOut(true)}
            title="Sign out"
            className="flex size-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-slate-400)] transition-colors hover:bg-[var(--color-slate-100)] hover:text-[var(--color-error)]"
          >
            <LogOut className="size-[18px]" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOut}
        icon={<LogOut className="size-5" />}
        title="Sign out?"
        description="You'll need to sign back in to access the dashboard."
        confirmLabel="Sign out"
        onConfirm={() => {
          setConfirmOut(false);
          signOut();
        }}
        onCancel={() => setConfirmOut(false)}
      />
    </div>
  );
}
