import { cn } from "@/lib/cn";

const control =
  "w-full rounded-[var(--radius-md)] border border-[var(--color-slate-200)] bg-white px-3.5 py-2.5 text-sm " +
  "placeholder:text-[var(--color-slate-400)] transition-colors " +
  "hover:border-[var(--color-slate-300)] focus:border-[var(--color-indigo)] focus-visible:shadow-none " +
  "focus:outline-none focus:ring-[3px] focus:ring-[var(--color-indigo-100)]";

export function Label({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[13px] font-medium text-[var(--color-slate-700)]"
    >
      {children}
    </label>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(control, "resize-y leading-relaxed", className)} {...props} />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(control, "cursor-pointer pr-9", className)} {...props}>
      {children}
    </select>
  );
}
