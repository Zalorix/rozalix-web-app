"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Smile, ChevronDown } from "lucide-react";

// Lazy-loaded so the (heavy) picker never ships with the customer chat widget —
// it's only pulled in here in the dashboard when opened.
const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] w-[300px] items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-slate-200)] bg-white text-[13px] text-[var(--color-slate-400)]">
      Loading…
    </div>
  ),
});

export function EmojiPickerButton({
  value,
  isEmoji,
  onPick,
}: {
  value: string;
  /** Whether `value` is an emoji (vs an uploaded image). */
  isEmoji: boolean;
  onPick: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-slate-200)] bg-white px-2.5 py-2 text-[13px] font-medium text-[var(--color-slate-600)] transition-colors hover:border-[var(--color-slate-300)]"
      >
        {isEmoji ? (
          <span className="text-base leading-none">{value}</span>
        ) : (
          <Smile className="size-4 text-[var(--color-slate-400)]" />
        )}
        Choose emoji
        <ChevronDown className="size-3.5 text-[var(--color-slate-400)]" />
      </button>

      {open && (
        <div className="absolute left-0 z-40 mt-2 shadow-[var(--shadow-lift)]">
          <EmojiPicker
            onEmojiClick={(d) => {
              onPick(d.emoji);
              setOpen(false);
            }}
            width={300}
            height={360}
            lazyLoadEmojis
            previewConfig={{ showPreview: false }}
            skinTonesDisabled
          />
        </div>
      )}
    </div>
  );
}
