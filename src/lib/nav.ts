import { LayoutDashboard, Inbox, FileText, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Inbox },
  { href: "/content", label: "Content", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function titleForPath(pathname: string): string {
  const item = NAV_ITEMS.find(
    (n) => pathname === n.href || pathname.startsWith(`${n.href}/`),
  );
  return item?.label ?? "Dashboard";
}
