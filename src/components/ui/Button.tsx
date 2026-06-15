import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius-md)] " +
  "transition-[transform,box-shadow,background-color,color] duration-150 " +
  "disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap cursor-pointer";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--color-indigo)] text-white shadow-[var(--shadow-card)] hover:bg-[var(--color-indigo-dark)] hover:-translate-y-px",
  secondary:
    "bg-white text-[var(--color-slate-700)] border border-[var(--color-slate-200)] hover:border-[var(--color-slate-300)] hover:bg-[var(--color-slate-50)]",
  ghost:
    "bg-transparent text-[var(--color-slate-600)] hover:bg-[var(--color-slate-100)] hover:text-[var(--color-ink-900)]",
  danger:
    "bg-[var(--color-error-soft)] text-[var(--color-error)] border border-transparent hover:border-[var(--color-error)]/30",
};

const sizes: Record<Size, string> = {
  sm: "text-[13px] h-9 px-3",
  md: "text-sm h-10 px-4",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
