"use client";

import Link from "next/link";
import { cn, formatCurrency, getScoreColor, getScoreGradient } from "@/lib/utils";
import type { Activity, ActivityKPIs } from "@/types";
import { TrendingUp, TrendingDown, Clock, AlertTriangle, Plus } from "lucide-react";
import { useAppStore } from "@/store/app.store";

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
  /** Numero progetti attivi (in_progress, planning) — opzionale */
  activeProjectsCount?: number;
  /** Numero alert critici non letti — opzionale */
  criticalAlertsCount?: number;
}

export function ActivityCard({ activity, activeProjectsCount = 0, criticalAlertsCount = 0 }: ActivityCardProps) {
  const { setCurrentActivity } = useAppStore();
  const kpis: ActivityKPIs = activity.kpis ?? EMPTY_KPIS;
  const hasData = !!activity.kpis;

  return (
    <Link
      href={`/dashboard/${activity.id}`}
      onClick={() => setCurrentActivity(activity.id)}
      className={cn(
        "block rounded-lg md:rounded-xl border border-border/50 bg-card p-2.5 sm:p-4 md:p-5",
        "transition-all duration-200 hover:border-border hover:shadow-lg hover:shadow-black/20",
        "group cursor-pointer"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-1.5 sm:mb-3 md:mb-4">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <div
            className="flex h-6 w-6 sm:h-8 sm:w-8 md:h-9 md:w-9 items-center justify-center rounded-md md:rounded-xl font-bold text-[10px] sm:text-sm shrink-0"
            style={{
              backgroundColor: `${activity.color}20`,
              color: activity.color,
              border: `1px solid ${activity.color}30`,
            }}
          >
            {activity.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[11px] sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
              {activity.name}
            </h3>
            <p className="text-[9px] sm:text-xs text-muted-foreground truncate">
              {activity.sector}
            </p>
          </div>
        </div>

        {/* Health Score */}
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <span
            className={cn(
              "text-sm sm:text-lg md:text-xl font-bold tabular-nums",
              hasData ? getScoreColor(kpis.healthScore) : "text-muted-foreground"
            )}
          >
            {hasData ? kpis.healthScore : "—"}
          </span>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground">health</span>
        </div>
      </div>

      {/* Health bar */}
      <div className="mb-1.5 sm:mb-3 md:mb-4">
        <div className="h-0.5 sm:h-1.5 rounded-full bg-secondary overflow-hidden">
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
        <div className="flex flex-col items-center justify-center py-1.5 sm:py-4 gap-1 sm:gap-2 text-center">
          <div className="flex h-5 w-5 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-secondary">
            <Plus className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </div>
          <p className="text-[9px] sm:text-xs text-muted-foreground">
            Aggiungi progetti e dati finanziari
            <br />
            per visualizzare le KPI
          </p>
        </div>
      ) : (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-3 mb-1.5 sm:mb-3 md:mb-4">
            <div>
              <p className="text-[8px] sm:text-[10px] text-muted-foreground mb-0.5">Revenue</p>
              <p className="text-[10px] sm:text-sm font-bold tabular-nums">
                {formatCurrency(kpis.totalRevenue, "EUR", true)}
              </p>
            </div>
            <div>
              <p className="text-[8px] sm:text-[10px] text-muted-foreground mb-0.5">Margine</p>
              <p
                className={cn(
                  "text-[10px] sm:text-sm font-bold tabular-nums",
                  kpis.grossMarginPct >= 0 ? "text-emerald-400" : "text-red-400"
                )}
              >
                {kpis.grossMarginPct.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-[8px] sm:text-[10px] text-muted-foreground mb-0.5">ROI</p>
              <div className="flex items-center gap-0.5 sm:gap-1">
                {kpis.roi >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-400" />
                )}
                <p
                  className={cn(
                    "text-[10px] sm:text-sm font-bold tabular-nums",
                    kpis.roi >= 0 ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {kpis.roi.toFixed(1)}%
                </p>
              </div>
            </div>
            <div>
              <p className="text-[8px] sm:text-[10px] text-muted-foreground mb-0.5">Runway</p>
              <div className="flex items-center gap-0.5 sm:gap-1">
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
                    "text-[10px] sm:text-sm font-bold tabular-nums",
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
          <div className="flex items-center justify-between text-[9px] sm:text-[11px] text-muted-foreground border-t border-border/30 pt-1.5 sm:pt-3 gap-1 flex-wrap">
            <span>
              {activeProjectsCount} progett{activeProjectsCount === 1 ? "o" : "i"} attiv{activeProjectsCount === 1 ? "o" : "i"}
            </span>

            {criticalAlertsCount > 0 && (
              <div className="flex items-center gap-1 text-red-400 font-medium">
                <AlertTriangle className="h-3 w-3" />
                <span>{criticalAlertsCount} critico</span>
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
