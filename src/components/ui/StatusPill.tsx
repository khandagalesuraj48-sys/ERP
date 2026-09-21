import { cn } from "@/lib/utils";

type Tone = "moving" | "idle" | "stopped" | "offline" | "blue" | "green" | "amber" | "red" | "slate";

const TONE: Record<Tone, string> = {
  moving: "bg-emerald-50 text-emerald-700 border border-emerald-200/80",
  green: "bg-emerald-50 text-emerald-700 border border-emerald-200/80",
  idle: "bg-amber-50 text-amber-700 border border-amber-200/80",
  amber: "bg-amber-50 text-amber-700 border border-amber-200/80",
  stopped: "bg-red-50 text-red-700 border border-red-200/80",
  red: "bg-red-50 text-red-700 border border-red-200/80",
  offline: "bg-gray-100 text-gray-600 border border-gray-200/80",
  slate: "bg-gray-100 text-gray-600 border border-gray-200/80",
  blue: "bg-blue-50 text-blue-700 border border-blue-200/80",
};

const DOT: Record<Tone, string> = {
  moving: "bg-emerald-500",
  green: "bg-emerald-500",
  idle: "bg-amber-500",
  amber: "bg-amber-500",
  stopped: "bg-red-500",
  red: "bg-red-500",
  offline: "bg-gray-400",
  slate: "bg-gray-400",
  blue: "bg-blue-500",
};

export function StatusPill({
  tone,
  children,
  dot = true,
  className,
}: {
  tone: Tone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium capitalize select-none leading-none",
        TONE[tone],
        className
      )}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", DOT[tone])} />}
      <span>{children}</span>
    </span>
  );
}
