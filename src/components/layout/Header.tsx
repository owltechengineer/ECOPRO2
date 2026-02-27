"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { cn, formatDate } from "@/lib/utils";
import { useAppStore } from "@/store/app.store";
import { getGlobalAlerts } from "@/data/mock";
import { Bell, Search, RefreshCw, Settings, LogOut } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { AlertPanel } from "@/components/dashboard/AlertPanel";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

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
  const router = useRouter();
  const { currentActivityId, setCurrentActivity } = useAppStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const activities = useAppStore((s) => s.activities);
  const currentActivity = activities.find((a) => a.id === currentActivityId);
  const allAlerts = getGlobalAlerts();
  const alerts = allAlerts.filter((a) => !a.isRead);
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");

  const title = getPageTitle(pathname, currentActivity?.name);

  const filteredActivities = searchQuery.trim()
    ? activities.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activities;

  const handleRefresh = () => router.refresh();

  const handleSearchSelect = (activityId: string) => {
    setCurrentActivity(activityId);
    setSearchOpen(false);
    setSearchQuery("");
    router.push(`/dashboard/${activityId}`);
  };

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
        <button
          onClick={() => setSearchOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Cerca"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Ricarica"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Notifiche"
            >
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
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 max-h-[min(24rem,70vh)] overflow-y-auto p-0">
            <div className="p-3 border-b border-border/50">
              <h3 className="text-sm font-semibold text-foreground">Notifiche</h3>
            </div>
            <div className="p-3">
              <AlertPanel alerts={allAlerts} limit={10} />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Account */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 hover:bg-primary/30 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Account"
            >
              <span className="text-[11px] font-bold text-primary">F</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-3 border-b border-border/50">
              <p className="text-sm font-medium text-foreground">Fabiano Gaio</p>
              <p className="text-xs text-muted-foreground">
                {activities.filter((a) => a.isActive).length} attività attive
              </p>
            </div>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="flex items-center gap-2">
                <Settings className="h-3.5 w-3.5" />
                Impostazioni
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-muted-foreground">
              <LogOut className="h-3.5 w-3.5" />
              Esci (coming soon)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search Modal */}
      <Modal
        open={searchOpen}
        onClose={() => {
          setSearchOpen(false);
          setSearchQuery("");
        }}
        title="Cerca"
        description="Cerca attività, progetti o voci"
        size="md"
      >
        <div className="space-y-4">
          <Input
            placeholder="Digita per cercare..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="w-full"
          />
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filteredActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nessun risultato
              </p>
            ) : (
              filteredActivities.map((a) => (
                <button
                  key={a.id}
                  onClick={() => handleSearchSelect(a.id)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    "hover:bg-accent",
                    currentActivityId === a.id && "bg-accent/50"
                  )}
                >
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${a.color}20`,
                      color: a.color,
                    }}
                  >
                    <span className="text-xs font-bold">{a.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.name}</p>
                    {a.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {a.description}
                      </p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </header>
  );
}
