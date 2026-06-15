import { cn } from "@/lib/cn";

/** True when the icon value is an uploaded image (data URL) or remote URL. */
export function isImageIcon(icon: string): boolean {
  return /^(data:|https?:)/.test(icon);
}

/**
 * Renders an agent avatar — either an uploaded image or an emoji in a circle.
 * `className` styles the circle (size + background); `emojiClassName` the glyph.
 */
export function AgentAvatar({
  icon,
  className,
  emojiClassName,
  style,
}: {
  icon: string;
  className?: string;
  emojiClassName?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        className,
      )}
      style={style}
    >
      {isImageIcon(icon) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={icon} alt="" className="size-full object-cover" />
      ) : (
        <span className={emojiClassName}>{icon}</span>
      )}
    </span>
  );
}
