"use client";

import { useEffect, useState } from "react";

/**
 * True at the `lg` breakpoint and up. Used to switch between the desktop
 * (paginated table/list) and mobile (scroll-to-load cards) experiences.
 * Defaults to false on the server / first paint, then resolves on mount.
 */
export function useIsDesktop(query = "(min-width: 1024px)"): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);

  return isDesktop;
}
