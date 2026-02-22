"use client";

import { notFound } from "next/navigation";
import { use, useState, useEffect } from "react";
import { getProjects } from "@/actions/projects";
import { getTasks } from "@/actions/tasks";
import type { AIReport } from "@/types";
import {
  formatCurrency,
  formatPercent,
  formatHours,
  getStatusBg,
  getPriorityBg,
  getScoreColor,
  getScoreGradient,
  cn,
} from "@/lib/utils";
import { Stat } from "@/components/ui/stat";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertPanel } from "@/components/dashboard/AlertPanel";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Briefcase,
  Clock,
  Target,
  Zap,
  ChevronRight,
  BarChart2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ActivityActions } from "@/components/dashboard/ActivityActions";
import { ClientOnly } from "@/components/ui/client-only";
import { useActivity } from "@/hooks/useActivity";

function CashFlowTooltip({
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
    <div className="rounded-lg border border-border/50 bg-card px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{formatCurrency(p.value, "EUR", true)}</span>
        </div>
      ))}
    </div>
  );
}

export default function ActivityDashboardPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const { activityId } = use(params);
  const activity = useActivity(activityId);

  if (!activity) return notFound();

  const kpis = activity.kpis ?? null;
  const [projects, setProjects] = useState<import("@/types").Project[]>([]);
  const [tasks, setTasks] = useState<import("@/types").Task[]>([]);

  useEffect(() => {
    getProjects(activityId).then((r) => { if (r.ok) setProjects(r.data); });
    getTasks(activityId).then((r) => { if (r.ok) setTasks(r.data); });
  }, [activityId]);

  const alerts: import("@/types").Alert[] = [];
  const aiReport = null as AIReport | null;

  // New activity without data yet — show setup screen
  if (!kpis) {
    return <ActivitySetupScreen activity={activity} />;
  }

  const activeProjects = projects.filter((p) =>
    ["in_progress", "planning"].includes(p.status)
  );
  const completedProjects = projects.filter((p) => p.status === "completed");
  const overdueTasks = tasks.filter(
    (t) => t.status !== "done" && new Date(t.deadline) < new Date()
  );
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");

  const cashflowData: { month: string; income: number; expenses: number; net: number }[] = [];

  const methodologyData = projects.reduce(
    (acc, p) => {
      acc[p.methodology] = (acc[p.methodology] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      {/* ── Activity Header ── */}
      <div
        className="rounded-xl border p-5 relative overflow-hidden"
        style={{
          borderColor: `${activity.color}30`,
          background: `linear-gradient(135deg, ${activity.color}08 0%, transparent 60%)`,
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-xl font-black"
              style={{
                backgroundColor: `${activity.color}20`,
                color: activity.color,
                border: `1px solid ${activity.color}40`,
              }}
            >
              {activity.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">
                {activity.name}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {activity.description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="neutral">{activity.sector}</Badge>
                {activity.businessModels.slice(0, 2).map((bm) => (
                  <Badge key={bm} variant="default">
                    {bm.toUpperCase()}
                  </Badge>
                ))}
                <Badge
                  variant={
                    activity.lifecycleStage === "growth"
                      ? "success"
                      : activity.lifecycleStage === "validation"
                      ? "warning"
                      : "info"
                  }
                >
                  {activity.lifecycleStage}
                </Badge>
              </div>
            </div>
          </div>

          {/* CRUD actions + Health score */}
          <div className="flex flex-col items-end gap-3">
            <ActivityActions activity={activity} />
          <div className="flex flex-col items-center gap-1">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <svg className="absolute inset-0" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-secondary"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke={activity.color}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${(kpis.healthScore / 100) * 175.9} 175.9`}
                  transform="rotate(-90 32 32)"
                  strokeOpacity={0.85}
                />
              </svg>
              <span
                className={cn(
                  "text-xl font-black tabular-nums",
                  getScoreColor(kpis.healthScore)
                )}
              >
                {kpis.healthScore}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Health
            </span>
          </div>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border/30">
          <div>
            <p className="text-[11px] text-muted-foreground">Capitale Investito</p>
            <p className="text-sm font-bold">
              {formatCurrency(activity.capitalInvested, "EUR", true)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Ore/settimana</p>
            <p className="text-sm font-bold">{activity.weeklyTimeAllocated}h</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Geografia</p>
            <p className="text-sm font-bold">
              {activity.geography.slice(0, 2).join(", ")}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Progetti attivi</p>
            <p className="text-sm font-bold">{activeProjects.length}</p>
          </div>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Stat
          label="Revenue"
          value={formatCurrency(kpis.totalRevenue, "EUR", true)}
          delta={kpis.revenueGrowthRate}
          icon={<TrendingUp className="h-4 w-4" />}
          accent={activity.color}
        />
        <Stat
          label="Margine Lordo"
          value={`${kpis.grossMarginPct.toFixed(1)}%`}
          delta={kpis.grossMarginPct - 30}
          deltaLabel="vs target 30%"
          icon={<Target className="h-4 w-4" />}
          accent="#10b981"
        />
        <Stat
          label="ROI"
          value={`${kpis.roi.toFixed(1)}%`}
          delta={kpis.roi}
          icon={<Zap className="h-4 w-4" />}
          accent="#f59e0b"
        />
        <Stat
          label="Cash Flow"
          value={formatCurrency(kpis.cashFlow, "EUR", true)}
          delta={kpis.cashFlow > 0 ? 1 : -1}
          icon={<Activity className="h-4 w-4" />}
          accent="#06b6d4"
        />
        <Stat
          label="Burn Rate"
          value={formatCurrency(kpis.burnRate, "EUR", true)}
          deltaLabel="al mese"
          icon={<Clock className="h-4 w-4" />}
          accent={kpis.runwayMonths <= 6 ? "#f43f5e" : "#64748b"}
        />
        <Stat
          label="Runway"
          value={
            kpis.runwayMonths === Infinity
              ? "∞"
              : `${kpis.runwayMonths}m`
          }
          icon={<Briefcase className="h-4 w-4" />}
          accent={kpis.runwayMonths <= 6 ? "#f43f5e" : "#10b981"}
        />
      </div>

      {/* ── Second row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Costi Totali"
          value={formatCurrency(kpis.totalCosts, "EUR", true)}
          delta={-kpis.costVariance}
          deltaLabel="vs budget"
          size="sm"
        />
        <Stat
          label="EBITDA"
          value={formatCurrency(kpis.ebitda, "EUR", true)}
          delta={kpis.ebitdaPct}
          deltaLabel="EBITDA %"
          size="sm"
        />
        <Stat
          label="Produttività"
          value={`${kpis.productivityIndex}/100`}
          delta={kpis.productivityIndex - 70}
          deltaLabel="vs baseline 70"
          size="sm"
        />
        <Stat
          label="Budget Utilizzato"
          value={`${kpis.budgetUtilizationPct.toFixed(0)}%`}
          delta={kpis.budgetUtilizationPct > 100 ? -(kpis.budgetUtilizationPct - 100) : kpis.budgetUtilizationPct - 100}
          deltaLabel="vs budget allocato"
          size="sm"
        />
      </div>

      {/* ── Content grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects list */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Progetti
              </CardTitle>
              <Link
                href={`/dashboard/${activityId}/projects`}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                Vedi tutti <ChevronRight className="h-3 w-3" />
              </Link>
            </CardHeader>

            <div className="space-y-3">
              {projects.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-sm font-medium truncate">{project.name}</p>
                      <span className={cn("badge text-[10px]", getStatusBg(project.status))}>
                        {project.status.replace("_", " ")}
                      </span>
                      <span className={cn("badge text-[10px]", getPriorityBg(project.priority))}>
                        {project.priority}
                      </span>
                    </div>
                    <Progress
                      value={project.completionPct}
                      size="xs"
                      showLabel
                    />
                    <div className="flex items-center gap-4 mt-1.5 text-[11px] text-muted-foreground">
                      <span>
                        Budget: {formatCurrency(project.budgetActual, "EUR", true)}/
                        {formatCurrency(project.budgetEstimated, "EUR", true)}
                      </span>
                      <span>
                        Rev: {formatCurrency(project.revenueActual, "EUR", true)}/
                        {formatCurrency(project.revenueEstimated, "EUR", true)}
                      </span>
                      <span>
                        Scadenza:{" "}
                        {new Date(project.endDate).toLocaleDateString("it-IT", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {projects.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Nessun progetto. Crea il primo progetto.
                </p>
              )}
            </div>
          </Card>

          {/* Task overview */}
          <Card>
            <CardHeader>
              <CardTitle>Task Attivi</CardTitle>
              <div className="flex items-center gap-2">
                {overdueTasks.length > 0 && (
                  <Badge variant="danger">{overdueTasks.length} in ritardo</Badge>
                )}
                <Link
                  href={`/dashboard/${activityId}/projects`}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  Tutti <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>

            <div className="space-y-2">
              {inProgressTasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/30 transition-colors"
                >
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full shrink-0",
                      task.priority === "critical"
                        ? "bg-red-500"
                        : task.priority === "high"
                        ? "bg-orange-500"
                        : "bg-amber-500"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{task.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">
                        {formatHours(task.actualHours)}/{formatHours(task.estimatedHours)}
                      </span>
                      <span
                        className={cn(
                          "text-[10px]",
                          new Date(task.deadline) < new Date()
                            ? "text-red-400 font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        {new Date(task.deadline).toLocaleDateString("it-IT", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={task.completionPct}
                    size="xs"
                    className="w-16"
                    showLabel
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar col */}
        <div className="space-y-4">
          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Alert</CardTitle>
              {alerts.filter((a) => !a.isRead).length > 0 && (
                <Badge variant={alerts.some((a) => a.severity === "critical") ? "danger" : "warning"}>
                  {alerts.filter((a) => !a.isRead).length}
                </Badge>
              )}
            </CardHeader>
            <AlertPanel alerts={alerts} limit={4} />
          </Card>

          {/* Project stats */}
          <Card>
            <CardHeader>
              <CardTitle>Avanzamento Progetti</CardTitle>
            </CardHeader>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Completati</span>
                <span className="text-xs font-bold text-emerald-400">
                  {completedProjects.length}/{projects.length}
                </span>
              </div>
              <Progress
                value={completedProjects.length}
                max={projects.length || 1}
                color="bg-emerald-500"
                size="sm"
              />
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/30">
                <div className="text-center p-2 rounded-lg bg-secondary/50">
                  <p className="text-lg font-bold text-emerald-400">{completedProjects.length}</p>
                  <p className="text-[10px] text-muted-foreground">Completati</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-secondary/50">
                  <p className="text-lg font-bold text-blue-400">{activeProjects.length}</p>
                  <p className="text-[10px] text-muted-foreground">In corso</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-secondary/50">
                  <p className="text-lg font-bold text-red-400">{overdueTasks.length}</p>
                  <p className="text-[10px] text-muted-foreground">Task ritardo</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-secondary/50">
                  <p className="text-lg font-bold">{inProgressTasks.length}</p>
                  <p className="text-[10px] text-muted-foreground">In progress</p>
                </div>
              </div>
            </div>
          </Card>

          {/* AI snippet */}
          {aiReport && (
            <Card
              style={{ borderColor: `${activity.color}30`, background: `${activity.color}05` }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  AI Insights
                </CardTitle>
                <Link
                  href={`/dashboard/${activityId}/ai`}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  Report completo
                </Link>
              </CardHeader>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
                {aiReport.summary}
              </p>
              {aiReport.recommendations.slice(0, 1).map((rec) => (
                <div
                  key={rec.id}
                  className="mt-3 p-2.5 rounded-lg bg-secondary/50"
                >
                  <p className="text-xs font-semibold text-primary">
                    ⚡ {rec.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {rec.estimatedImpact}
                  </p>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>

      {/* ── Cash Flow Chart ── */}
      {cashflowData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Mensile</CardTitle>
            <span className="text-xs text-muted-foreground">ultimi 12 mesi</span>
          </CardHeader>
          <ClientOnly fallback={<div className="h-[200px] bg-secondary/20 rounded animate-pulse" />}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={cashflowData}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="cfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={activity.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={activity.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`
                }
              />
              <Tooltip content={<CashFlowTooltip />} />
              <Area
                type="monotone"
                dataKey="netCashFlow"
                stroke={activity.color}
                strokeWidth={2}
                fill="url(#cfGrad)"
                name="Net Cash Flow"
              />
              <Area
                type="monotone"
                dataKey="inflows"
                stroke="#10b981"
                strokeWidth={1.5}
                fill="transparent"
                strokeDasharray="4 2"
                name="Entrate"
              />
              <Area
                type="monotone"
                dataKey="outflows"
                stroke="#f43f5e"
                strokeWidth={1.5}
                fill="transparent"
                strokeDasharray="4 2"
                name="Uscite"
              />
            </AreaChart>
          </ResponsiveContainer>
          </ClientOnly>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Setup screen for new activities (no KPIs yet)
// ─────────────────────────────────────────────

function ActivitySetupScreen({ activity }: { activity: import("@/types").Activity }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 text-center max-w-lg mx-auto">
      {/* Icon */}
      <div
        className="flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-black"
        style={{ backgroundColor: `${activity.color}20`, color: activity.color, border: `2px solid ${activity.color}30` }}
      >
        {activity.name.charAt(0)}
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold mb-2">{activity.name}</h1>
        <p className="text-sm text-muted-foreground">
          {activity.description || `${activity.sector} · ${activity.lifecycleStage}`}
        </p>
        <div className="flex justify-center mt-3">
          <ActivityActions activity={activity} showLabels />
        </div>
      </div>

      {/* Setup steps */}
      <div className="w-full space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Inizia ad aggiungere dati
        </p>
        {[
          {
            icon: Briefcase,
            title: "Crea il primo progetto",
            desc: "Aggiungi un progetto con budget, date e obiettivi",
            href: `/dashboard/${activity.id}/projects`,
            color: "#6366f1",
          },
          {
            icon: TrendingUp,
            title: "Registra entrate e costi",
            desc: "Aggiungi dati finanziari per calcolare ROI e margini",
            href: `/dashboard/${activity.id}/finance`,
            color: "#10b981",
          },
          {
            icon: BarChart2,
            title: "Crea uno scenario forecast",
            desc: "Simula proiezioni di revenue e cash flow",
            href: `/dashboard/${activity.id}/simulations`,
            color: "#f59e0b",
          },
        ].map((step) => (
          <Link
            key={step.href}
            href={step.href}
            className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card hover:border-border hover:bg-accent/10 transition-all group text-left"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
              style={{ backgroundColor: `${step.color}15`, color: step.color }}
            >
              <step.icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
          </Link>
        ))}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 justify-center">
        {activity.businessModels.map((bm: string) => (
          <span
            key={bm}
            className="px-2.5 py-1 rounded-md text-xs font-semibold"
            style={{ backgroundColor: `${activity.color}15`, color: activity.color }}
          >
            {bm.toUpperCase()}
          </span>
        ))}
        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-secondary text-muted-foreground">
          {activity.lifecycleStage}
        </span>
        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-secondary text-muted-foreground">
          {activity.weeklyTimeAllocated}h/sett.
        </span>
      </div>
    </div>
  );
}
