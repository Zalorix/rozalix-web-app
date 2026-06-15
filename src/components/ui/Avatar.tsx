import { cn } from "@/lib/cn";

const sizes = {
  sm: "size-8 text-[12px]",
  md: "size-10 text-[14px]",
  lg: "size-12 text-base",
};

export function Avatar({
  initials,
  accent = "var(--color-indigo)",
  size = "md",
  image,
  className,
}: {
  initials: string;
  accent?: string;
  size?: keyof typeof sizes;
  /** Optional image (logo / photo) shown instead of initials. */
  image?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white",
        sizes[size],
        className,
      )}
      style={
        image
          ? undefined
          : {
              background: `linear-gradient(140deg, ${accent}, color-mix(in srgb, ${accent} 70%, #000 18%))`,
            }
      }
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="size-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}
