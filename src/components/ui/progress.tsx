import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  size?: "xs" | "sm" | "md";
  color?: string;
  className?: string;
  showLabel?: boolean;
}

const sizes = {
  xs: "h-1",
  sm: "h-1.5",
  md: "h-2",
};

export function Progress({
  value,
  max = 100,
  size = "sm",
  color,
  className,
  showLabel,
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  const getAutoColor = () => {
    if (pct >= 80) return "bg-emerald-500";
    if (pct >= 50) return "bg-blue-500";
    if (pct >= 25) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("flex-1 rounded-full bg-secondary overflow-hidden", sizes[size])}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            color ?? getAutoColor()
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs tabular-nums text-muted-foreground w-9 text-right">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}
