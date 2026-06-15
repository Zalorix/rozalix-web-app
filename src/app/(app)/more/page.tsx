"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bot,
  FileText,
  Settings as SettingsIcon,
  LogOut,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useWorkspace } from "@/lib/client-context";
import { Avatar } from "@/components/ui/Avatar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const initialsOf = (name?: string) =>
  (name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

interface Row {
  href: string;
  label: string;
  hint: string;
  icon: LucideIcon;
}

const WORKSPACE: Row[] = [
  { href: "/assistant", label: "Assistant", hint: "Train & constrain Rio", icon: Bot },
  { href: "/content", label: "Content", hint: "Edit your site pages", icon: FileText },
  { href: "/settings", label: "Settings", hint: "Account & website", icon: SettingsIcon },
];

export default function MorePage() {
  const { user, signOut } = useAuth();
  const { client } = useWorkspace();
  const [confirmOut, setConfirmOut] = useState(false);

  return (
    <div className="mx-auto w-full max-w-xl space-y-5">
      {/* Account hero */}
      <div className="flex items-center gap-3.5 rounded-[18px] bg-[linear-gradient(135deg,var(--color-indigo),var(--color-violet))] p-4 text-white shadow-[0_6px_18px_rgba(79,70,229,.3)]">
        <Avatar
          size="lg"
          initials={initialsOf(user?.name)}
          image={client?.logo}
          className="bg-white/20"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15.5px] font-semibold">{user?.name}</div>
          <div className="truncate text-[12.5px] text-white/80">
            {user?.email} · {user?.role}
          </div>
        </div>
      </div>

      {/* Workspace links */}
      <div>
        <p className="mb-2 px-1 text-[11.5px] font-semibold tracking-[0.03em] text-[var(--color-slate-400)] uppercase">
          Workspace
        </p>
        <div className="overflow-hidden rounded-[16px] border border-[var(--color-slate-200)] bg-white shadow-[0_1px_3px_rgba(15,23,42,.06)]">
          {WORKSPACE.map((row, i) => {
            const Icon = row.icon;
            return (
              <Link
                key={row.href}
                href={row.href}
                className={
                  "flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-[var(--color-slate-50)]" +
                  (i > 0 ? " border-t border-[var(--color-slate-100)]" : "")
                }
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-[var(--color-indigo-50)] text-[var(--color-indigo)]">
                  <Icon className="size-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-medium">
                    {row.label}
                  </span>
                  <span className="block text-[12px] text-[var(--color-slate-400)]">
                    {row.hint}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-[var(--color-slate-300)]" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Sign out */}
      <button
        type="button"
        onClick={() => setConfirmOut(true)}
        className="flex w-full items-center gap-2.5 rounded-[16px] border border-[var(--color-slate-200)] bg-white px-4 py-3.5 text-[14.5px] font-medium text-[var(--color-error)] shadow-[0_1px_3px_rgba(15,23,42,.06)] transition-colors hover:bg-[var(--color-slate-50)]"
      >
        <LogOut className="size-[18px]" /> Sign out
      </button>

      <p className="text-center text-[11.5px] text-[var(--color-slate-300)]">
        Rozalix Console · v1.0
      </p>

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
