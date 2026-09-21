import { cn } from "@/lib/utils";

/** Material Symbols icon wrapper. */
export function Icon({
  name,
  className,
  fill,
  size,
}: {
  name: string;
  className?: string;
  fill?: boolean;
  size?: number;
}) {
  return (
    <span
      className={cn("material-symbols-outlined", className)}
      style={{
        ...(fill ? { fontVariationSettings: "'FILL' 1" } : {}),
        ...(size ? { fontSize: `${size}px` } : {}),
      }}
    >
      {name}
    </span>
  );
}
