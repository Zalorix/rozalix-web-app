export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon && (
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-[var(--color-slate-100)] text-[var(--color-slate-400)]">
          {icon}
        </div>
      )}
      <h3 className="text-[15px] font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-[var(--color-slate-500)]">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        width: 18,
        height: 18,
        border: "2px solid var(--color-slate-200)",
        borderTopColor: "var(--color-indigo)",
        borderRadius: "50%",
        animation: "rzx-spin 0.7s linear infinite",
      }}
    >
      <style>{`@keyframes rzx-spin{to{transform:rotate(360deg)}}`}</style>
    </span>
  );
}
