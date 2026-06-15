"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Grows a "visible count" as a sentinel element scrolls into view — the
 * mobile "scroll to load more" pattern. Resets to `step` whenever `resetKey`
 * changes (e.g. a filter/search change), so the list starts from the top again.
 *
 * Attach `sentinelRef` to an element at the end of the list; the returned
 * `count` is how many items to render (capped at `total`).
 */
export function useInfiniteCount(
  total: number,
  step: number,
  resetKey: unknown,
) {
  const [count, setCount] = useState(step);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCount(step);
  }, [resetKey, step]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setCount((c) => c + step);
      },
      { rootMargin: "240px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [step, total]);

  return { count: Math.min(count, total), sentinelRef };
}
