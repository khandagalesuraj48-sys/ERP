import { cn } from "@/lib/utils";

/** Material Symbols icon wrapper. */
export function Icon({
  name,
  className,
  fill,
}: {
  name: string;
  className?: string;
  fill?: boolean;
}) {
  return (
    <span
      className={cn("material-symbols-outlined", className)}
      style={fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}
