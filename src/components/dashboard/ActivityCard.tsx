"use client";

import Link from "next/link";
import { cn, formatCurrency, getScoreColor, getScoreGradient } from "@/lib/utils";
import type { Activity, ActivityKPIs } from "@/types";
import { TrendingUp, TrendingDown, Clock, AlertTriangle, Plus } from "lucide-react";
import { useAppStore } from "@/store/app.store";
import { getAlertsByActivity, getProjectsByActivity } from "@/data/mock";

// Default KPIs for activities without real data yet
const EMPTY_KPIS: ActivityKPIs = {
  totalRevenue: 0,
  totalCosts: 0,
  grossMargin: 0,
  grossMarginPct: 0,
  netMargin: 0,
  netMarginPct: 0,
  ebitda: 0,
  ebitdaPct: 0,
  roi: 0,
  paybackPeriodMonths: 0,
  cashFlow: 0,
  burnRate: 0,
  runwayMonths: Infinity,
  revenueGrowthRate: 0,
  costVariance: 0,
  revenueVariance: 0,
  productivityIndex: 0,
  healthScore: 0,
  budgetUtilizationPct: 0,
  period: "",
};

interface ActivityCardProps {
  activity: Activity;
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const { setCurrentActivity } = useAppStore();
  const kpis: ActivityKPIs = activity.kpis ?? EMPTY_KPIS;
  const hasData = !!activity.kpis;

  const alerts = getAlertsByActivity(activity.id).filter((a) => !a.isDismissed);
  const projects = getProjectsByActivity(activity.id);
  const activeProjects = projects.filter((p) =>
    ["in_progress", "planning"].includes(p.status)
  );
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");

  return (
    <Link
      href={`/dashboard/${activity.id}`}
      onClick={() => setCurrentActivity(activity.id)}
      className={cn(
        "block rounded-xl border border-border/50 bg-card p-5",
        "transition-all duration-200 hover:border-border hover:shadow-lg hover:shadow-black/20",
        "group cursor-pointer"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl font-bold text-sm shrink-0"
            style={{
              backgroundColor: `${activity.color}20`,
              color: activity.color,
              border: `1px solid ${activity.color}30`,
            }}
          >
            {activity.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
              {activity.name}
            </h3>
            <p className="text-xs text-muted-foreground truncate max-w-[160px]">
              {activity.sector}
            </p>
          </div>
        </div>

        {/* Health Score */}
        <div className="flex flex-col items-end gap-1">
          <span
            className={cn(
              "text-xl font-bold tabular-nums",
              hasData ? getScoreColor(kpis.healthScore) : "text-muted-foreground"
            )}
          >
            {hasData ? kpis.healthScore : "—"}
          </span>
          <span className="text-[10px] text-muted-foreground">health</span>
        </div>
      </div>

      {/* Health bar */}
      <div className="mb-4">
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full bg-gradient-to-r transition-all",
              hasData ? getScoreGradient(kpis.healthScore) : "from-muted to-muted"
            )}
            style={{ width: hasData ? `${kpis.healthScore}%` : "0%" }}
          />
        </div>
      </div>

      {/* No data state for new activities */}
      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-4 gap-2 text-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
            <Plus className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">
            Aggiungi progetti e dati finanziari
            <br />
            per visualizzare le KPI
          </p>
        </div>
      ) : (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Revenue</p>
              <p className="text-sm font-bold tabular-nums">
                {formatCurrency(kpis.totalRevenue, "EUR", true)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Margine</p>
              <p
                className={cn(
                  "text-sm font-bold tabular-nums",
                  kpis.grossMarginPct >= 0 ? "text-emerald-400" : "text-red-400"
                )}
              >
                {kpis.grossMarginPct.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">ROI</p>
              <div className="flex items-center gap-1">
                {kpis.roi >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-400" />
                )}
                <p
                  className={cn(
                    "text-sm font-bold tabular-nums",
                    kpis.roi >= 0 ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {kpis.roi.toFixed(1)}%
                </p>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Runway</p>
              <div className="flex items-center gap-1">
                <Clock
                  className={cn(
                    "h-3 w-3",
                    kpis.runwayMonths <= 6
                      ? "text-red-400"
                      : kpis.runwayMonths <= 12
                      ? "text-amber-400"
                      : "text-emerald-400"
                  )}
                />
                <p
                  className={cn(
                    "text-sm font-bold tabular-nums",
                    kpis.runwayMonths <= 6
                      ? "text-red-400"
                      : kpis.runwayMonths <= 12
                      ? "text-amber-400"
                      : ""
                  )}
                >
                  {kpis.runwayMonths === Infinity ? "∞" : `${kpis.runwayMonths}m`}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/30 pt-3">
            <span>
              {activeProjects.length} progett{activeProjects.length === 1 ? "o" : "i"} attiv{activeProjects.length === 1 ? "o" : "i"}
            </span>

            {criticalAlerts.length > 0 && (
              <div className="flex items-center gap-1 text-red-400 font-medium">
                <AlertTriangle className="h-3 w-3" />
                <span>{criticalAlerts.length} critico</span>
              </div>
            )}

            <div className="flex items-center gap-1">
              {kpis.revenueGrowthRate > 0 ? (
                <TrendingUp className="h-3 w-3 text-emerald-400" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-400" />
              )}
              <span
                className={
                  kpis.revenueGrowthRate > 0 ? "text-emerald-400" : "text-red-400"
                }
              >
                {kpis.revenueGrowthRate > 0 ? "+" : ""}
                {kpis.revenueGrowthRate.toFixed(1)}% YoY
              </span>
            </div>
          </div>
        </>
      )}
    </Link>
  );
}
