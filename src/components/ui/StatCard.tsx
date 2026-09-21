import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

type Accent = "blue" | "green" | "amber" | "red" | "slate";

const ACCENT: Record<Accent, { icon: string; bg: string }> = {
  blue: { icon: "text-blue-600", bg: "bg-blue-50/80 border border-blue-100" },
  green: { icon: "text-emerald-600", bg: "bg-emerald-50/80 border border-emerald-100" },
  amber: { icon: "text-amber-600", bg: "bg-amber-50/80 border border-amber-100" },
  red: { icon: "text-rose-600", bg: "bg-rose-50/80 border border-rose-100" },
  slate: { icon: "text-slate-600", bg: "bg-slate-50/80 border border-slate-200" },
};

export function StatCard({
  label,
  value,
  sub,
  icon,
  accent = "blue",
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  accent?: Accent;
  trend?: { dir: "up" | "down"; value: string };
}) {
  return (
    <div className="glass-card p-4 flex flex-col justify-between gap-2.5 select-none hover:border-blue-200/80 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-slate-500 tracking-tight">{label}</span>
        <div
          className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-105",
            ACCENT[accent].bg,
            ACCENT[accent].icon
          )}
        >
          <Icon name={icon} className="text-[16px]" />
        </div>
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <p className="text-[24px] font-bold text-slate-900 tracking-tight leading-none font-mono">
            {value}
          </p>
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-[11px] font-semibold",
                trend.dir === "up" ? "text-emerald-600" : "text-rose-600"
              )}
            >
              <Icon
                name={trend.dir === "up" ? "trending_up" : "trending_down"}
                className="text-[14px]"
              />
              {trend.value}
            </span>
          )}
        </div>
        {sub && <p className="text-[11px] text-slate-400 mt-1 font-medium">{sub}</p>}
      </div>
    </div>
  );
}
