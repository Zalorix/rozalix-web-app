"use client";

import { useEffect, useState } from "react";
import { Download, Check, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

// The Chrome/Android install event isn't in TS's lib yet.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * "Install app" affordance. On Chrome/Android we capture the native
 * `beforeinstallprompt` and trigger it on click; on iOS (which has no such
 * event) we show the manual Share → Add to Home Screen instructions.
 */
export function InstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !("MSStream" in window),
    );
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  if (installed) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-emerald,#059669)]">
        <Check className="size-4" /> Installed
      </span>
    );
  }

  if (isIOS) {
    return (
      <p className="flex items-center gap-1.5 text-[13px] text-[var(--color-slate-500)]">
        Tap <Share className="size-4 shrink-0" /> then
        <span className="inline-flex items-center gap-1 font-medium text-[var(--color-slate-600)]">
          <Plus className="size-3.5" /> Add to Home Screen
        </span>
      </p>
    );
  }

  return (
    <Button variant="secondary" onClick={install} disabled={!deferred}>
      <Download className="size-4" /> Install app
    </Button>
  );
}
