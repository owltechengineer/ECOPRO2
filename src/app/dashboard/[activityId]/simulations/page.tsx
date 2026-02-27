"use client";

import { use, useState, useEffect } from "react";
import { notFound } from "next/navigation";
import toast from "react-hot-toast";
import { getScenarios } from "@/actions/scenarios";
import { useActivity } from "@/hooks/useActivity";
import { ActivityActions } from "@/components/dashboard/ActivityActions";
import { ScenarioForm } from "@/components/forms/ScenarioForm";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteScenario, setActiveScenario } from "@/actions/scenarios";
import { Pencil, Trash2, Star } from "lucide-react";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientOnly } from "@/components/ui/client-only";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Play,
  Plus,
  CheckCircle2,
  Zap,
} from "lucide-react";
import type { ForecastScenario } from "@/types";

function ScenarioTooltip({
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

const SCENARIO_COLORS: Record<string, string> = {
  base: "#6366f1",
  optimistic: "#10b981",
  pessimistic: "#f43f5e",
  custom: "#f59e0b",
};

const SCENARIO_LABELS: Record<string, string> = {
  base: "Base",
  optimistic: "Ottimistico",
  pessimistic: "Pessimistico",
  custom: "Custom",
};

function ScenarioCard({
  scenario,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onSetActive,
}: {
  scenario: ForecastScenario;
  isSelected: boolean;
  onSelect: () => void;
  onEdit?: (s: ForecastScenario) => void;
  onDelete?: (s: ForecastScenario) => void;
  onSetActive?: (id: string) => void;
}) {
  const color = SCENARIO_COLORS[scenario.type] ?? "#6366f1";

  return (
    <div
      className={cn(
        "rounded-xl border p-4 cursor-pointer transition-all duration-200 group",
        isSelected
          ? "border-primary/50 bg-primary/5"
          : "border-border/50 bg-card hover:border-border"
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs font-bold">{scenario.name}</span>
            {scenario.isActive && (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            )}
          </div>
          <Badge
            variant={
              scenario.type === "optimistic"
                ? "success"
                : scenario.type === "pessimistic"
                ? "danger"
                : "info"
            }
            size="sm"
          >
            {SCENARIO_LABELS[scenario.type]}
          </Badge>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          {onSetActive && (
            <button
              onClick={() => onSetActive(scenario.id)}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded transition-colors",
                scenario.isActive
                  ? "text-amber-400 bg-amber-500/20"
                  : "text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10"
              )}
              title={scenario.isActive ? "Scenario attivo — usato come riferimento per KPI e forecast" : "Clicca per impostare come scenario attivo (riferimento per KPI)"}
            >
              <Star className={cn("h-3 w-3", scenario.isActive && "fill-amber-400")} />
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(scenario)}
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(scenario)}
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {scenario.description && (
        <p className="text-[11px] text-muted-foreground mb-3 line-clamp-2">
          {scenario.description}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] text-muted-foreground">Revenue Prev.</p>
          <p className="text-sm font-bold tabular-nums">
            {formatCurrency(scenario.projectedRevenue, "EUR", true)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">ROI Prev.</p>
          <p
            className={cn(
              "text-sm font-bold tabular-nums",
              scenario.projectedROI >= 0 ? "text-emerald-400" : "text-red-400"
            )}
          >
            {scenario.projectedROI > 0 ? "+" : ""}
            {scenario.projectedROI.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Margine %</p>
          <p className="text-sm font-bold tabular-nums">
            {scenario.projectedMarginPct.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Break-even</p>
          <p className="text-sm font-bold">
            {scenario.breakEvenMonth ?? "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

function AssumptionsTable({ scenario }: { scenario: ForecastScenario }) {
  const a = scenario.assumptions;
  const rows = [
    { label: "Crescita Revenue mensile", value: `${a.revenueGrowthRate}%`, formula: "Revenue × (1 + g/100)" },
    { label: "Inflazione costi", value: `${a.costInflationRate}%`, formula: "Costi × (1 + i/100)" },
    { label: "Nuovi clienti/mese", value: `${a.newCustomersPerMonth}`, formula: "Clienti + N_nuovi − Churn" },
    { label: "AOV (Avg Order Value)", value: formatCurrency(a.averageOrderValue), formula: "Revenue / Clienti" },
    { label: "Churn Rate mensile", value: `${a.churnRate}%`, formula: "Clienti × churn/100" },
    { label: "Marketing spend/mese", value: formatCurrency(a.marketingSpend), formula: "Costo fisso acquisizione" },
  ];

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50 bg-secondary/30">
            <th className="text-left text-[11px] font-semibold text-muted-foreground px-4 py-2.5">Assunzione</th>
            <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5">Valore</th>
            <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5 hidden sm:table-cell">Formula</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="table-row">
              <td className="px-4 py-2.5 text-xs font-medium">{row.label}</td>
              <td className="px-3 py-2.5">
                <span className="text-xs font-bold text-primary tabular-nums">{row.value}</span>
              </td>
              <td className="px-3 py-2.5 hidden sm:table-cell">
                <span className="text-[10px] font-mono text-muted-foreground">{row.formula}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SimulationsPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const { activityId } = use(params);
  const activity = useActivity(activityId);
  if (!activity) return notFound();

  const [scenarios, setScenarios] = useState<ForecastScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("");
  const [compareMode, setCompareMode] = useState(false);

  useEffect(() => {
    getScenarios(activityId).then((r) => {
      if (r.ok) {
        setScenarios(r.data);
        if (r.data.length > 0) setSelectedScenarioId(r.data[0].id);
      }
    });
  }, [activityId]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editScenario_, setEditScenario_] = useState<(typeof scenarios)[0] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<(typeof scenarios)[0] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    const result = await deleteScenario(deleteTarget.id, activityId);
    setDeletingId(null);
    setDeleteTarget(null);
    if (!result.ok) { toast.error(result.error); return; }
    const updated = scenarios.filter((s) => s.id !== deleteTarget.id);
    setScenarios(updated);
    if (selectedScenarioId === deleteTarget.id) setSelectedScenarioId(updated[0]?.id ?? "");
    toast.success("Scenario eliminato");
  }

  async function handleSetActive(id: string) {
    const result = await setActiveScenario(id, activityId);
    if (!result.ok) { toast.error(result.error); return; }
    setScenarios((prev) => prev.map((s) => ({ ...s, isActive: s.id === id })));
    toast.success("Scenario attivato");
  }

  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId);

  // Prepare projection chart data
  const projectionData = selectedScenario?.projections.map((p) => ({
    month: p.month.slice(5),
    Revenue: p.revenue,
    Costi: p.costs,
    Margine: p.margin,
    "Cash Flow cum.": p.cumulativeCashFlow,
    Clienti: p.customers,
  })) ?? [];

  // Compare all scenarios
  const compareData = (() => {
    const allMonths = new Set<string>();
    scenarios.forEach((s) =>
      s.projections.forEach((p) => allMonths.add(p.month))
    );

    return Array.from(allMonths)
      .sort()
      .map((month) => {
        const row: Record<string, string | number> = { month: month.slice(5) };
        scenarios.forEach((s) => {
          const proj = s.projections.find((p) => p.month === month);
          if (proj) row[s.name] = proj.revenue;
        });
        return row;
      });
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{activity.name} — Simulazioni & Forecast</h2>
          <p className="text-sm text-muted-foreground">
            Analisi what-if e proiezioni finanziarie multi-scenario
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ActivityActions activity={activity} />
          <Button
            variant={compareMode ? "primary" : "outline"}
            size="sm"
            onClick={() => setCompareMode(!compareMode)}
          >
            Confronta scenari
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Nuovo scenario
          </Button>
        </div>
      </div>

      {scenarios.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-muted-foreground mb-4">
            Nessun scenario configurato per questa attività
          </p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Crea primo scenario
          </Button>
        </Card>
      ) : (
        <>
          {/* Scenario cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.map((scenario) => (
              <ScenarioCard
                onEdit={(s) => setEditScenario_(s)}
                onDelete={(s) => setDeleteTarget(s)}
                onSetActive={handleSetActive}
                key={scenario.id}
                scenario={scenario}
                isSelected={selectedScenarioId === scenario.id}
                onSelect={() => setSelectedScenarioId(scenario.id)}
              />
            ))}
          </div>

          {/* Comparison chart */}
          {compareMode && compareData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Confronto Revenue — Tutti gli Scenari</CardTitle>
              </CardHeader>
              <ClientOnly fallback={<div className="h-[250px] bg-secondary/20 rounded animate-pulse" />}>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={compareData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`}
                  />
                  <Tooltip content={<ScenarioTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  {scenarios.map((s) => (
                    <Line
                      key={s.id}
                      type="monotone"
                      dataKey={s.name}
                      stroke={SCENARIO_COLORS[s.type] ?? "#6366f1"}
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray={s.type === "pessimistic" ? "4 2" : undefined}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
              </ClientOnly>
            </Card>
          )}

          {/* Selected scenario detail */}
          {selectedScenario && !compareMode && (
            <>
              {/* Projection charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue & Costi Previsti</CardTitle>
                    <Badge
                      variant={
                        selectedScenario.type === "optimistic"
                          ? "success"
                          : selectedScenario.type === "pessimistic"
                          ? "danger"
                          : "info"
                      }
                    >
                      {SCENARIO_LABELS[selectedScenario.type]}
                    </Badge>
                  </CardHeader>
                  <ClientOnly fallback={<div className="h-[200px] bg-secondary/20 rounded animate-pulse" />}>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={projectionData}
                      margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
                      />
                      <Tooltip content={<ScenarioTooltip />} />
                      <Bar dataKey="Revenue" fill="#10b981" maxBarSize={22} fillOpacity={0.8} radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Costi" fill="#f43f5e" maxBarSize={22} fillOpacity={0.6} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  </ClientOnly>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cash Flow Cumulativo</CardTitle>
                  </CardHeader>
                  <ClientOnly fallback={<div className="h-[200px] bg-secondary/20 rounded animate-pulse" />}>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart
                      data={projectionData}
                      margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="cfGrad2" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor={SCENARIO_COLORS[selectedScenario.type]}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor={SCENARIO_COLORS[selectedScenario.type]}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
                      />
                      <Tooltip content={<ScenarioTooltip />} />
                      <ReferenceLine y={0} stroke="#f43f5e" strokeDasharray="3 3" strokeOpacity={0.5} />
                      <Area
                        type="monotone"
                        dataKey="Cash Flow cum."
                        stroke={SCENARIO_COLORS[selectedScenario.type]}
                        strokeWidth={2}
                        fill="url(#cfGrad2)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  </ClientOnly>
                </Card>
              </div>

              {/* Assumptions table */}
              <Card>
                <CardHeader>
                  <CardTitle>Assunzioni Scenario — {selectedScenario.name}</CardTitle>
                  <Button variant="ghost" size="sm">
                    <Zap className="h-3.5 w-3.5" />
                    Rigenera con AI
                  </Button>
                </CardHeader>
                <AssumptionsTable scenario={selectedScenario} />
              </Card>

              {/* What-if summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Riepilogo What-If</CardTitle>
                </CardHeader>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {[
                    {
                      label: "Revenue Annua Prevista",
                      value: formatCurrency(selectedScenario.projectedRevenue, "EUR", true),
                      positive: true,
                    },
                    {
                      label: "Costi Previsti",
                      value: formatCurrency(selectedScenario.projectedCosts, "EUR", true),
                      positive: false,
                    },
                    {
                      label: "Margine Previsto",
                      value: `${selectedScenario.projectedMarginPct.toFixed(1)}%`,
                      positive: selectedScenario.projectedMarginPct > 0,
                    },
                    {
                      label: "ROI Previsto",
                      value: `${selectedScenario.projectedROI.toFixed(1)}%`,
                      positive: selectedScenario.projectedROI > 0,
                    },
                    {
                      label: "Break-even",
                      value: selectedScenario.breakEvenMonth ?? "Non raggiunto",
                      positive: !!selectedScenario.breakEvenMonth,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="p-3 rounded-lg bg-secondary/30 text-center"
                    >
                      <p className="text-[10px] text-muted-foreground mb-1">{item.label}</p>
                      <p
                        className={cn(
                          "text-base font-bold tabular-nums",
                          item.positive ? "text-emerald-400" : "text-red-400"
                        )}
                      >
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </>
      )}

      {/* ── CRUD Modals ── */}
      <ScenarioForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        activityId={activityId}
        onSuccess={(s) => {
          setScenarios((prev) => [s, ...prev]);
          setSelectedScenarioId(s.id);
        }}
      />
      <ScenarioForm
        open={!!editScenario_}
        onClose={() => setEditScenario_(null)}
        activityId={activityId}
        scenario={editScenario_ ?? undefined}
        onSuccess={(s) => setScenarios((prev) => prev.map((x) => x.id === s.id ? s : x))}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Elimina scenario"
        description={`Stai per eliminare lo scenario "${deleteTarget?.name}". Azione irreversibile.`}
        loading={deletingId === deleteTarget?.id}
      />
    </div>
  );
}
