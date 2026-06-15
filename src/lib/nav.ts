import {
  LayoutDashboard,
  Inbox,
  MessageSquare,
  CalendarCheck,
  Bot,
  FileText,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Inbox },
  { href: "/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/assistant", label: "Assistant", icon: Bot },
  { href: "/content", label: "Content", icon: FileText },
];

/** Lives in the account area (next to sign out), not the main nav. */
export const SETTINGS_ITEM: NavItem = {
  href: "/settings",
  label: "Settings",
  icon: Settings,
};

export function titleForPath(pathname: string): string {
  if (pathname === "/more" || pathname.startsWith("/more/")) return "More";
  const item = [...NAV_ITEMS, SETTINGS_ITEM].find(
    (n) => pathname === n.href || pathname.startsWith(`${n.href}/`),
  );
  return item?.label ?? "Dashboard";
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/** Per-page description, shown as the topbar subtitle (no duplicate h2). */
export function subtitleForPath(
  pathname: string,
  clientName?: string,
  firstName?: string,
): string | undefined {
  const c = clientName ?? "your site";
  const on = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  if (on("/dashboard"))
    return `${greeting()}${firstName ? `, ${firstName}` : ""} — here's the latest on ${c}.`;
  if (on("/leads")) return `Enquiries from ${c} — contact form and AI chat.`;
  if (on("/conversations"))
    return `Live chats your AI receptionist is handling on ${c}.`;
  if (on("/bookings")) return "Calls your AI receptionist booked for you.";
  if (on("/assistant"))
    return `Train and constrain the AI receptionist for ${c}.`;
  if (on("/content")) return `Edit the pages on ${c} without touching code.`;
  if (on("/settings")) return "Your account and website connection.";
  return undefined;
}
