"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, MessageSquare, CalendarCheck, LayoutGrid } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { useNavBadges } from "@/lib/use-nav-badges";

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Other routes that should keep this tab highlighted (e.g. More → Settings). */
  also?: string[];
}

const TABS: Tab[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/conversations", label: "Chats", icon: MessageSquare },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck },
  {
    href: "/more",
    label: "More",
    icon: LayoutGrid,
    also: ["/assistant", "/content", "/settings"],
  },
];

/** Native-style bottom tab bar — mobile only; the desktop uses the sidebar. */
export function MobileTabBar() {
  const pathname = usePathname();
  const badges = useNavBadges();

  return (
    <nav
      className="sticky bottom-0 z-30 flex border-t border-[var(--color-slate-200)] bg-white/92 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
    >
      {TABS.map((tab) => {
        const active =
          pathname === tab.href ||
          pathname.startsWith(`${tab.href}/`) ||
          (tab.also?.some(
            (h) => pathname === h || pathname.startsWith(`${h}/`),
          ) ??
            false);
        const badge = badges[tab.href];
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-1 pt-2 pb-1 text-[10.5px] font-medium transition-colors",
              active
                ? "text-[var(--color-indigo)]"
                : "text-[var(--color-slate-400)]",
            )}
          >
            <span className="relative">
              <Icon className="size-[23px]" strokeWidth={2} />
              {badge && badge.count > 0 && (
                <span
                  className={cn(
                    "absolute -top-1 -right-2 flex h-[16px] min-w-[16px] items-center justify-center rounded-full border-2 border-white px-1 text-[10px] font-bold text-white",
                    badge.urgent
                      ? "bg-[var(--color-danger,#EF4444)]"
                      : "bg-[var(--color-indigo)]",
                  )}
                >
                  {badge.count}
                </span>
              )}
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
