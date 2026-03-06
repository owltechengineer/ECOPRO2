"use client";

import { useAppStore } from "@/store/app.store";
import { ActivityForm } from "@/components/forms/ActivityForm";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { getProjectsForActivities } from "@/actions/projects";
import { formatCurrency, formatPercent, getScoreColor } from "@/lib/utils";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { AlertPanel } from "@/components/dashboard/AlertPanel";
import { Stat } from "@/components/ui/stat";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientOnly } from "@/components/ui/client-only";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Briefcase,
  Clock,
  Target,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Custom Tooltip
// ─────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-card px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">
            {formatCurrency(p.value, "EUR", true)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function GlobalDashboardPage() {
  const pathname = usePathname();
  const activities = useAppStore((s) => s.activities);
  const [createOpen, setCreateOpen] = useState(false);

  // Global KPIs calculated from real activities (those with kpis data)
  const activitiesWithKPIs = activities.filter((a) => a.kpis);
  const globalKPIs = {
    totalRevenue: activitiesWithKPIs.reduce((s, a) => s + (a.kpis?.totalRevenue ?? 0), 0),
    grossMargin: activitiesWithKPIs.reduce((s, a) => s + (a.kpis?.grossMargin ?? 0), 0),
    grossMarginPct: activitiesWithKPIs.length > 0
      ? activitiesWithKPIs.reduce((s, a) => s + (a.kpis?.grossMarginPct ?? 0), 0) / activitiesWithKPIs.length
      : 0,
    revenueGrowthRate: 0,
    totalCosts: activitiesWithKPIs.reduce((s, a) => s + (a.kpis?.totalCosts ?? 0), 0),
    netProfit: activitiesWithKPIs.reduce((s, a) => s + (a.kpis?.netMargin ?? 0), 0),
    avgROI: activitiesWithKPIs.length > 0
      ? activitiesWithKPIs.reduce((s, a) => s + (a.kpis?.roi ?? 0), 0) / activitiesWithKPIs.length
      : 0,
    activeActivities: activities.filter((a) => a.isActive).length,
    totalActivities: activities.length,
  };
  const alerts: import("@/types").Alert[] = [];
  const criticalTasks: import("@/types").Task[] = [];
  const overdueTasks: import("@/types").Task[] = [];

  const [projectsByActivity, setProjectsByActivity] = useState<Record<string, number>>({});
  useEffect(() => {
    if (activities.length === 0) return;
    getProjectsForActivities(activities.map((a) => a.id)).then((r) => {
      if (!r.ok) return;
      const counts: Record<string, number> = {};
      r.data.forEach((p) => {
        if (["in_progress", "planning"].includes(p.status)) {
          counts[p.activityId] = (counts[p.activityId] ?? 0) + 1;
        }
      });
      setProjectsByActivity(counts);
    });
  }, [pathname, activities.length, activities.map((a) => a.id).join(",")]);

  // Chart data (use store activities)
  const revenueByActivity = activities.filter((a) => a.kpis).map((a) => ({
    name: a.name,
    Revenue: a.kpis!.totalRevenue,
    Costi: a.kpis!.totalCosts,
    color: a.color,
  }));

  const roiData = activities.filter((a) => a.kpis)
    .map((a) => ({ name: a.name, roi: a.kpis!.roi, color: a.color }))
    .sort((a, b) => b.roi - a.roi);

  const healthData = activities.filter((a) => a.kpis).map((a) => ({
    activity: a.name,
    score: a.kpis!.healthScore,
    fullMark: 100,
  }));

  const pieData = activities.filter(
    (a) => a.kpis && a.kpis.totalRevenue > 0
  ).map((a) => ({
    name: a.name,
    value: a.kpis!.totalRevenue,
    color: a.color,
  }));

  const unreadAlerts = alerts.filter((a) => !a.isRead);

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* ── 1. INTESTAZIONE ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Dashboard Globale</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Riepilogo di tutte le attività e KPI aggregati
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Nuova Activity
        </Button>
      </div>

      {/* ── 2. KPI RIEPILOGO ── */}
      <section>
        <h2 className="section-title mb-3">Riepilogo finanziario</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          <Stat
            label="Revenue Totale"
            value={formatCurrency(globalKPIs.totalRevenue, "EUR", true)}
            delta={globalKPIs.revenueGrowthRate}
            deltaLabel="vs anno precedente"
            icon={<TrendingUp className="h-4 w-4" />}
            accent="#6366f1"
          />
          <Stat
            label="Margine Lordo"
            value={formatCurrency(globalKPIs.grossMargin, "EUR", true)}
            delta={globalKPIs.grossMarginPct}
            deltaLabel="margine %"
            icon={<Target className="h-4 w-4" />}
            accent="#10b981"
          />
          <Stat
            label="ROI Medio"
            value={`${globalKPIs.avgROI.toFixed(1)}%`}
            delta={globalKPIs.avgROI}
            icon={<Activity className="h-4 w-4" />}
            accent="#f59e0b"
          />
          <Stat
            label="Profitto Netto"
            value={formatCurrency(globalKPIs.netProfit, "EUR", true)}
            icon={<Briefcase className="h-4 w-4" />}
            accent="#8b5cf6"
          />
          <Stat
            label="Costi Totali"
            value={formatCurrency(globalKPIs.totalCosts, "EUR", true)}
            icon={<TrendingDown className="h-4 w-4" />}
            accent="#06b6d4"
          />
          <Stat
            label="Attività"
            value={`${globalKPIs.activeActivities}/${globalKPIs.totalActivities}`}
            icon={<Clock className="h-4 w-4" />}
            accent="#10b981"
          />
        </div>
      </section>

      {/* ── 3. ATTENZIONE (Alert + Task) + LE TUE ATTIVITÀ ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Colonna sinistra: Attività da seguire */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          <h2 className="section-title">Le tue attività</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {activities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                activeProjectsCount={projectsByActivity[activity.id] ?? 0}
              />
            ))}
            {activities.length === 0 && (
              <div className="col-span-2 py-12 text-center rounded-xl border border-dashed border-border/50">
                <p className="text-sm text-muted-foreground mb-3">
                  Nessuna activity. Inizia creando la tua prima area di business.
                </p>
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Crea Activity
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Colonna destra: Alert e Task critici */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="section-title">Da non perdere</h2>
          <Card padding="none" className="p-3 sm:p-4 md:p-5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                Alert Globali
              </CardTitle>
              {unreadAlerts.length > 0 && (
                <Badge variant="warning">{unreadAlerts.length} non letti</Badge>
              )}
            </CardHeader>
            <div className="pt-0">
              <AlertPanel alerts={alerts} limit={5} />
            </div>
          </Card>

          <Card padding="none" className="p-3 sm:p-4 md:p-5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                Task Critici
              </CardTitle>
              <Badge variant="danger">{criticalTasks.length}</Badge>
            </CardHeader>
            <div className="flex flex-col gap-2 pt-0">
              {criticalTasks.slice(0, 4).map((task) => {
                const activity = activities.find(
                  (a) => a.id === task.activityId
                );
                return (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-2.5 rounded-lg bg-secondary/50"
                  >
                    <div
                      className="h-1.5 w-1.5 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: activity?.color ?? "#6366f1" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{task.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground">
                          {activity?.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span
                          className={cn(
                            "text-[10px] font-medium",
                            new Date(task.deadline) < new Date()
                              ? "text-red-400"
                              : "text-amber-400"
                          )}
                        >
                          {new Date(task.deadline) < new Date()
                            ? "In ritardo"
                            : `Scade ${new Date(task.deadline).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}`}
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={task.completionPct}
                      size="xs"
                      className="w-12 mt-1.5"
                    />
                  </div>
                );
              })}
              {criticalTasks.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nessun task critico
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* ── 4. ANALISI E GRAFICI ── */}
      <section>
        <h2 className="section-title mb-2 sm:mb-3">Analisi per attività</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Revenue & Costs Bar Chart */}
          <Card padding="none" className="p-3 sm:p-5 md:col-span-2">
          <CardHeader>
            <CardTitle>Revenue vs Costi per Attività</CardTitle>
            <span className="text-xs text-muted-foreground">YTD 2025</span>
          </CardHeader>
          <ClientOnly fallback={<div className="h-[220px] bg-secondary/20 rounded animate-pulse" />}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={revenueByActivity}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Revenue" radius={[3, 3, 0, 0]} maxBarSize={28}>
                {revenueByActivity.map((entry, index) => (
                  <Cell key={index} fill={entry.color} fillOpacity={0.85} />
                ))}
              </Bar>
              <Bar
                dataKey="Costi"
                radius={[3, 3, 0, 0]}
                fill="#334155"
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
          </ClientOnly>
        </Card>

        {/* ROI Ranking */}
        <Card padding="none" className="p-3 sm:p-5">
          <CardHeader>
            <CardTitle>ROI Ranking</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-3">
            {roiData.map((item, i) => {
              const activity = activities.find(
                (a) => a.name === item.name
              );
              return (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4 text-center">
                    {i + 1}
                  </span>
                  <div
                    className="h-4 w-4 rounded text-[9px] font-bold flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${item.color}25`,
                      color: item.color,
                    }}
                  >
                    {item.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{item.name}</span>
                      <span
                        className={cn(
                          "text-xs font-bold tabular-nums",
                          item.roi >= 0 ? "text-emerald-400" : "text-red-400"
                        )}
                      >
                        {item.roi > 0 ? "+" : ""}
                        {item.roi.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(0, (item.roi / 400) * 100))}%`,
                          backgroundColor: item.roi >= 0 ? item.color : "#f43f5e",
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        </div>
      </section>

      {/* ── 5. DISTRIBUZIONE E PERFORMANCE ── */}
      <section>
        <h2 className="section-title mb-2 sm:mb-3">Distribuzione e performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card padding="none" className="p-3 sm:p-5">
          <CardHeader>
            <CardTitle>Distribuzione Revenue</CardTitle>
          </CardHeader>
          <div className="flex items-center gap-6">
            <ClientOnly fallback={<div className="h-[140px] w-[140px] rounded-full bg-secondary/20 animate-pulse shrink-0" />}>
            <PieChart width={140} height={140}>
              <Pie
                data={pieData}
                cx={65}
                cy={65}
                innerRadius={42}
                outerRadius={62}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
            </ClientOnly>
            <div className="flex flex-col gap-2 flex-1">
              {pieData.map((item) => {
                const total = pieData.reduce((s, d) => s + d.value, 0);
                const pct = total > 0 ? (item.value / total) * 100 : 0;
                return (
                  <div
                    key={item.name}
                    className="flex items-center gap-2"
                  >
                    <div
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs flex-1">{item.name}</span>
                    <span className="text-xs font-bold tabular-nums">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Health radar */}
        <Card padding="none" className="p-3 sm:p-5">
          <CardHeader>
            <CardTitle>Health Score Comparativo</CardTitle>
          </CardHeader>
          <ClientOnly fallback={<div className="h-[180px] bg-secondary/20 rounded animate-pulse" />}>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={healthData}>
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis
                dataKey="activity"
                tick={{ fontSize: 10, fill: "#64748b" }}
              />
              <Radar
                name="Health"
                dataKey="score"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.15}
                strokeWidth={1.5}
              />
            </RadarChart>
          </ResponsiveContainer>
          </ClientOnly>
        </Card>
        </div>
      </section>

      <ActivityForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}
