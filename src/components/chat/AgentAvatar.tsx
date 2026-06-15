import { cn } from "@/lib/cn";
import { RobotMark } from "@/components/chat/RobotMark";

/** Sentinel icon value that renders the built-in Rozalix robot mark. */
export const ROBOT_ICON = "robot";

/** True when the icon value is an uploaded image (data URL) or remote URL. */
export function isImageIcon(icon: string): boolean {
  return /^(data:|https?:)/.test(icon);
}

/**
 * Renders an agent avatar — the built-in robot mark, an uploaded image, or an
 * emoji in a circle. `className` styles the circle (size + background);
 * `emojiClassName` the glyph; `accent` colours the robot (and its disc).
 */
export function AgentAvatar({
  icon,
  className,
  emojiClassName,
  accent = "var(--color-indigo)",
  style,
}: {
  icon: string;
  className?: string;
  emojiClassName?: string;
  accent?: string;
  style?: React.CSSProperties;
}) {
  const isRobot = icon === ROBOT_ICON;
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        className,
      )}
      // The robot sits on a solid accent disc so the white body pops; any
      // passed style still wins (e.g. the gradient on the settings preview).
      style={isRobot ? { background: accent, ...style } : style}
    >
      {isRobot ? (
        <RobotMark accent={accent} className="size-[78%]" />
      ) : isImageIcon(icon) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={icon} alt="" className="size-full object-cover" />
      ) : (
        <span className={emojiClassName}>{icon}</span>
      )}
    </span>
  );
}
