"use client";

import { usePathname } from "next/navigation";
import { cn, formatDate } from "@/lib/utils";
import { useAppStore } from "@/store/app.store";
import { getGlobalAlerts } from "@/data/mock";
import { Bell, Search, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Global Dashboard",
  "/projects": "Gestione Progetti",
  "/finance": "Finanza & Business Intelligence",
  "/simulations": "Simulazioni & Forecast",
  "/market": "Market Intelligence",
  "/ai": "AI Reports",
  "/settings": "Impostazioni",
};

function getPageTitle(pathname: string, activityName?: string): string {
  for (const [key, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.endsWith(key)) {
      if (activityName && key !== "/dashboard") {
        return `${activityName} — ${title}`;
      }
      return title;
    }
  }
  if (activityName) return `${activityName} — Dashboard`;
  return "ECOPRO";
}

export function Header() {
  const pathname = usePathname();
  const { currentActivityId } = useAppStore();

  const activities = useAppStore((s) => s.activities);
  const currentActivity = activities.find((a) => a.id === currentActivityId);
  const alerts = getGlobalAlerts().filter((a) => !a.isRead);
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");

  const title = getPageTitle(pathname, currentActivity?.name);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-sm px-6 gap-4">
      {/* Title area */}
      <div className="flex items-center gap-3 min-w-0">
        {currentActivity && (
          <div
            className="h-5 w-1 rounded-full shrink-0"
            style={{ backgroundColor: currentActivity.color }}
          />
        )}
        <h1 className="text-sm font-semibold text-foreground truncate">
          {title}
        </h1>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Date */}
        <span className="hidden sm:block text-xs text-muted-foreground">
          {formatDate(new Date().toISOString(), "long")}
        </span>

        <div className="h-4 w-px bg-border" />

        {/* Search */}
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <Search className="h-4 w-4" />
        </button>

        {/* Refresh */}
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <RefreshCw className="h-4 w-4" />
        </button>

        {/* Alerts */}
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <Bell className="h-4 w-4" />
          {alerts.length > 0 && (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center",
                "rounded-full text-[9px] font-bold text-white",
                criticalAlerts.length > 0 ? "bg-red-500" : "bg-amber-500"
              )}
            >
              {alerts.length}
            </span>
          )}
        </button>

        {/* Avatar */}
        <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-[11px] font-bold text-primary">F</span>
        </div>
      </div>
    </header>
  );
}
