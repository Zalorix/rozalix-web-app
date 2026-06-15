"use client";

import { useEffect } from "react";

/** Registers the service worker so the app is installable + offline-aware. */
export function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const register = () =>
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {
          /* registration is best-effort; ignore failures */
        });
    // Wait until the page settles so registration never competes with first paint.
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
