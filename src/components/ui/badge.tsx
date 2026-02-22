import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "neutral";
  size?: "sm" | "md";
  className?: string;
}

const variants = {
  default: "bg-primary/10 text-primary ring-primary/20",
  success: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  danger: "bg-red-500/10 text-red-400 ring-red-500/20",
  info: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
  neutral: "bg-slate-500/10 text-slate-400 ring-slate-500/20",
};

export function Badge({ children, variant = "default", size = "md", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "badge",
        variants[variant],
        size === "sm" ? "text-[10px] px-1.5 py-px" : "text-xs px-2 py-0.5",
        className
      )}
    >
      {children}
    </span>
  );
}
