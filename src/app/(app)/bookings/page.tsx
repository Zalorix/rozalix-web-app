"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, Phone, CalendarPlus } from "lucide-react";
import type { Booking } from "@/lib/assistant-types";
import { useWorkspace } from "@/lib/client-context";
import { listBookings } from "@/lib/assistant-store";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState, Spinner } from "@/components/ui/EmptyState";

function formatSlot(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function BookingsPage() {
  const { client } = useWorkspace();
  const [bookings, setBookings] = useState<Booking[] | null>(null);

  useEffect(() => {
    if (!client) return;
    let active = true;
    const load = () =>
      listBookings(client.id).then((b) => active && setBookings(b));
    load();
    const id = setInterval(load, 3000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [client]);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const up: Booking[] = [];
    const pa: Booking[] = [];
    (bookings ?? []).forEach((b) =>
      new Date(b.slotISO).getTime() >= now ? up.push(b) : pa.push(b),
    );
    return { upcoming: up, past: pa };
  }, [bookings]);

  return (
    <div className="space-y-5">
      {bookings === null ? (
        <Card className="flex justify-center py-20">
          <Spinner />
        </Card>
      ) : bookings.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CalendarCheck className="size-6" />}
            title="No bookings yet"
            description="When the AI books a call from a chat, it lands here with the customer's context."
          />
        </Card>
      ) : (
        <div className="space-y-6">
          <Section title="Upcoming" count={upcoming.length}>
            {upcoming.map((b) => (
              <BookingRow key={b.id} booking={b} accent={client?.accent} />
            ))}
            {upcoming.length === 0 && (
              <p className="px-5 py-6 text-sm text-[var(--color-slate-400)]">
                No upcoming calls.
              </p>
            )}
          </Section>
          {past.length > 0 && (
            <Section title="Past" count={past.length}>
              {past.map((b) => (
                <BookingRow
                  key={b.id}
                  booking={b}
                  accent={client?.accent}
                  muted
                />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-[13px] font-semibold tracking-wide text-[var(--color-slate-400)] uppercase">
          {title}
        </h3>
        <span className="rounded-full bg-[var(--color-slate-100)] px-1.5 text-[11px] font-semibold text-[var(--color-slate-500)]">
          {count}
        </span>
      </div>
      <Card className="overflow-hidden">{children}</Card>
    </div>
  );
}

function BookingRow({
  booking,
  accent,
  muted,
}: {
  booking: Booking;
  accent?: string;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 border-b border-[var(--color-slate-100)] px-5 py-4 last:border-0",
        muted && "opacity-70",
      )}
    >
      <div className="flex w-14 shrink-0 flex-col items-center rounded-[var(--radius-md)] bg-[var(--color-indigo-50)] py-2 text-[var(--color-indigo-deeper)]">
        <span className="text-[11px] font-semibold uppercase">
          {new Date(booking.slotISO).toLocaleString("en-US", {
            month: "short",
          })}
        </span>
        <span className="text-lg font-bold leading-none">
          {new Date(booking.slotISO).getDate()}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Avatar
            size="sm"
            initials={booking.customerName.slice(0, 2).toUpperCase()}
            accent={accent}
          />
          <span className="font-medium">{booking.customerName}</span>
          <span className="inline-flex items-center gap-1 text-[13px] text-[var(--color-slate-500)]">
            <CalendarPlus className="size-3.5" />
            {formatSlot(booking.slotISO)}
          </span>
        </div>
        <p className="mt-1.5 text-sm text-[var(--color-slate-600)]">
          {booking.summary}
        </p>
        <a
          href={`tel:${booking.customerPhone}`}
          className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-indigo)] hover:underline"
        >
          <Phone className="size-3.5" /> {booking.customerPhone}
        </a>
      </div>
    </div>
  );
}
