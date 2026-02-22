"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app.store";
import { ActivityForm } from "@/components/forms/ActivityForm";
import { Plus } from "lucide-react";
import { useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  ChartBar,
  LineChart,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  Globe,
  Zap,
} from "lucide-react";

// ─────────────────────────────────────────────
// Navigation items per-activity
// ─────────────────────────────────────────────

const ACTIVITY_NAV = [
  {
    href: "",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/projects",
    label: "Progetti",
    icon: Briefcase,
  },
  {
    href: "/finance",
    label: "Finanza & BI",
    icon: ChartBar,
  },
  {
    href: "/simulations",
    label: "Simulazioni",
    icon: LineChart,
  },
  {
    href: "/market",
    label: "Market Intel",
    icon: Globe,
  },
  {
    href: "/ai",
    label: "AI Reports",
    icon: Bot,
  },
];

// ─────────────────────────────────────────────
// Lifecycle badge
// ─────────────────────────────────────────────

function lifecycleLabel(stage: string): string {
  const map: Record<string, string> = {
    idea: "Idea",
    validation: "Validation",
    early_stage: "Early",
    growth: "Growth",
    scale: "Scale",
    mature: "Mature",
    exit: "Exit",
  };
  return map[stage] ?? stage;
}

// ─────────────────────────────────────────────
// Main Sidebar
// ─────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const { currentActivityId, setCurrentActivity, sidebarCollapsed, toggleSidebar, activities } =
    useAppStore();

  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-30 flex flex-col",
        "bg-sidebar border-r border-sidebar-border",
        "transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-sidebar-border">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="text-sm font-bold text-foreground tracking-tight">
                ECOPRO
              </span>
              <span className="ml-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Pro
              </span>
            </div>
          </div>
        )}

        {sidebarCollapsed && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 mx-auto">
            <Zap className="h-4 w-4 text-primary" />
          </div>
        )}

        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Collapsed toggle */}
      {sidebarCollapsed && (
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-16 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground shadow-sm transition-colors"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      )}

      {/* Global Dashboard link */}
      <div className="px-3 pt-3">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
            "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent",
            pathname === "/dashboard" &&
              "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
            sidebarCollapsed && "justify-center px-0"
          )}
          title={sidebarCollapsed ? "Global Dashboard" : undefined}
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && <span>Global Dashboard</span>}
        </Link>
      </div>

      {/* Activities section */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-3">
        {!sidebarCollapsed && (
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="section-title">Activities</p>
            <button
              onClick={() => setCreateOpen(true)}
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
              title="Nuova Activity"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="flex flex-col gap-1">
          {activities.map((activity) => {
            const isSelected = currentActivityId === activity.id;
            const isOnActivityPage = pathname.includes(`/dashboard/${activity.id}`);

            return (
              <div key={activity.id} className="flex flex-col">
                {/* Activity header button */}
                <button
                  onClick={() => setCurrentActivity(activity.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors w-full text-left",
                    "hover:bg-sidebar-accent",
                    isSelected
                      ? "text-sidebar-accent-foreground"
                      : "text-sidebar-foreground",
                    sidebarCollapsed && "justify-center px-0"
                  )}
                  title={sidebarCollapsed ? activity.name : undefined}
                >
                  <div
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
                    style={{ backgroundColor: `${activity.color}30`, color: activity.color }}
                  >
                    <span className="text-[10px] font-bold">
                      {activity.name.charAt(0)}
                    </span>
                  </div>
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 truncate font-medium text-xs">
                        {activity.name}
                      </span>
                      <span
                        className="text-[9px] font-medium px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: `${activity.color}20`,
                          color: activity.color,
                        }}
                      >
                        {lifecycleLabel(activity.lifecycleStage)}
                      </span>
                    </>
                  )}
                </button>

                {/* Sub-navigation when activity selected */}
                {isSelected && !sidebarCollapsed && (
                  <div className="ml-3 pl-4 border-l border-sidebar-border flex flex-col gap-0.5 mb-1">
                    {ACTIVITY_NAV.map((item) => {
                      const href = `/dashboard/${activity.id}${item.href}`;
                      const isActive =
                        item.href === ""
                          ? pathname === href
                          : pathname.startsWith(href);

                      return (
                        <Link
                          key={item.href}
                          href={href}
                          className={cn(
                            "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                          )}
                        >
                          <item.icon className="h-3.5 w-3.5 shrink-0" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-3 py-3 flex flex-col gap-1">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
            "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            sidebarCollapsed && "justify-center px-0"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && <span>Impostazioni</span>}
        </Link>

        {/* User stub */}
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg">
            <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold text-primary">F</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">Fabiano Gaio</p>
              <p className="text-[10px] text-muted-foreground truncate">
                {activities.filter((a) => a.isActive).length} attività attive
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>

    <ActivityForm
      open={createOpen}
      onClose={() => setCreateOpen(false)}
      onSuccess={(a) => setCurrentActivity(a.id)}
    />
    </>
  );
}
