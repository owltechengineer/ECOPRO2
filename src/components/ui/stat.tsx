import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatProps {
  label: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  icon?: React.ReactNode;
  accent?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Stat({
  label,
  value,
  delta,
  deltaLabel,
  icon,
  accent,
  className,
  size = "md",
}: StatProps) {
  const isPositive = delta !== undefined && delta > 0;
  const isNegative = delta !== undefined && delta < 0;
  const isNeutral = delta !== undefined && delta === 0;

  return (
    <div className={cn("kpi-card animate-fade-in", className)}>
      <div className="flex items-center justify-between">
        <span className="data-label">{label}</span>
        {icon && (
          <div
            className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-lg shrink-0"
            style={{ backgroundColor: accent ? `${accent}20` : undefined }}
          >
            <span style={{ color: accent ?? undefined }}>{icon}</span>
          </div>
        )}
      </div>

      <div className="flex items-end justify-between gap-2">
        <span
          className={cn(
            "font-bold tabular-nums leading-none",
            size === "lg" ? "text-xl sm:text-2xl md:text-3xl" : size === "sm" ? "text-base sm:text-lg md:text-xl" : "text-lg sm:text-xl md:text-2xl"
          )}
        >
          {value}
        </span>

        {delta !== undefined && (
          <div
            className={cn(
              "flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium",
              isPositive && "bg-emerald-500/10 text-emerald-400",
              isNegative && "bg-red-500/10 text-red-400",
              isNeutral && "bg-slate-500/10 text-slate-400"
            )}
          >
            {isPositive && <TrendingUp className="h-3 w-3" />}
            {isNegative && <TrendingDown className="h-3 w-3" />}
            {isNeutral && <Minus className="h-3 w-3" />}
            <span>
              {delta > 0 ? "+" : ""}
              {delta.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {deltaLabel && (
        <p className="text-xs text-muted-foreground">{deltaLabel}</p>
      )}
    </div>
  );
}
