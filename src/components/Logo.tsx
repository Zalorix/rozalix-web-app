import { cn } from "@/lib/cn";

/** Rozalix "R" mark — indigo→violet gradient tile. */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-[var(--radius-md)] font-[var(--font-display)] text-[17px] font-bold text-white",
        className,
      )}
      style={{
        background:
          "linear-gradient(140deg, var(--color-indigo), var(--color-violet))",
      }}
    >
      R
    </span>
  );
}
