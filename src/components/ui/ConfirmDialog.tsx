"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";

/** Lightweight centered confirmation modal. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger,
  icon,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  icon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // Portal target only exists on the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[var(--color-ink-900)]/40 backdrop-blur-[1px]"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--color-slate-200)] bg-white p-6 shadow-[var(--shadow-lift)]"
      >
        {icon && (
          <div
            className={
              danger
                ? "mb-4 flex size-11 items-center justify-center rounded-full bg-[var(--color-error-soft)] text-[var(--color-error)]"
                : "mb-4 flex size-11 items-center justify-center rounded-full bg-[var(--color-indigo-50)] text-[var(--color-indigo)]"
            }
          >
            {icon}
          </div>
        )}
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && (
          <p className="mt-1.5 text-sm text-[var(--color-slate-500)]">
            {description}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2.5">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
