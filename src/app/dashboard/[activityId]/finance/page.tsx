"use client";

import { use, useState, useEffect } from "react";
import { notFound } from "next/navigation";
import toast from "react-hot-toast";
import { getProjects } from "@/actions/projects";
import { getFinancialRecords } from "@/actions/financial";
import { useActivity } from "@/hooks/useActivity";
import { ActivityActions } from "@/components/dashboard/ActivityActions";
import { FinancialForm } from "@/components/forms/FinancialForm";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteFinancialRecord } from "@/actions/financial";
import { Pencil, Trash2 } from "lucide-react";
import {
  cn,
  formatCurrency,
  formatDate,
  formatPercent,
} from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stat } from "@/components/ui/stat";
import { ClientOnly } from "@/components/ui/client-only";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FinancialRecord } from "@/types";

function ChartTooltip({
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
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{formatCurrency(p.value, "EUR", true)}</span>
        </div>
      ))}
    </div>
  );
}

function FinancialTable({
  records,
  onEdit,
  onDelete,
}: {
  records: FinancialRecord[];
  onEdit?: (r: FinancialRecord) => void;
  onDelete?: (r: FinancialRecord) => void;
}) {
  const [filter, setFilter] = useState<string>("all");

  const filtered = records.filter(
    (r) => filter === "all" || r.type === filter
  );

  const typeColors: Record<string, string> = {
    revenue: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    direct_cost: "bg-red-500/10 text-red-400 ring-red-500/20",
    indirect_cost: "bg-orange-500/10 text-orange-400 ring-orange-500/20",
    investment: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
    tax: "bg-slate-500/10 text-slate-400 ring-slate-500/20",
    financing: "bg-violet-500/10 text-violet-400 ring-violet-500/20",
  };

  const types = ["all", "revenue", "direct_cost", "indirect_cost", "investment"];

  return (
    <div>
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium transition-colors capitalize",
                filter === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {t === "all"
                ? "Tutti"
                : t === "direct_cost"
                ? "Costi Diretti"
                : t === "indirect_cost"
                ? "Costi Indiretti"
                : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

      <div className="rounded-lg border border-border/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-secondary/30">
              <th className="text-left text-[11px] font-semibold text-muted-foreground px-4 py-2.5">
                Descrizione
              </th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5 hidden sm:table-cell">
                Categoria
              </th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5">
                Tipo
              </th>
              <th className="text-right text-[11px] font-semibold text-muted-foreground px-3 py-2.5">
                Importo
              </th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5 hidden md:table-cell">
                Data
              </th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-2.5 hidden lg:table-cell">
                Ricorrente
              </th>
              <th className="w-16 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="table-row group/row">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {r.type === "revenue" ? (
                      <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5 text-red-400 shrink-0" />
                    )}
                    <span className="text-sm font-medium">{r.description}</span>
                  </div>
                </td>
                <td className="px-3 py-3 hidden sm:table-cell">
                  <span className="text-xs text-muted-foreground capitalize">
                    {r.category}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className={cn("badge text-[10px]", typeColors[r.type] ?? "")}>
                    {r.type.replace("_", " ")}
                  </span>
                </td>
                <td className="px-3 py-3 text-right">
                  <span
                    className={cn(
                      "text-sm font-bold tabular-nums",
                      r.type === "revenue"
                        ? "text-emerald-400"
                        : "text-red-400"
                    )}
                  >
                    {r.type === "revenue" ? "+" : "-"}
                    {formatCurrency(r.amount, r.currency)}
                  </span>
                </td>
                <td className="px-3 py-3 hidden md:table-cell">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(r.date)}
                  </span>
                </td>
                <td className="px-3 py-3 hidden lg:table-cell">
                  {r.isRecurring ? (
                    <Badge variant="info" size="sm">
                      {r.recurringInterval ?? "ricorrente"}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(r)}
                        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(r)}
                        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Nessuna registrazione trovata
          </div>
        )}
      </div>
    </div>
  );
}

export default function FinancePage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const { activityId } = use(params);
  const activity = useActivity(activityId);
  if (!activity) return notFound();

  const kpis = activity.kpis ?? null;
  const [projects, setProjects] = useState<import("@/types").Project[]>([]);
  const [records, setRecords] = useState<import("@/types").FinancialRecord[]>([]);

  useEffect(() => {
    getProjects(activityId).then((r) => { if (r.ok) setProjects(r.data); });
    getFinancialRecords(activityId).then((r) => { if (r.ok) setRecords(r.data); });
  }, [activityId]);

  const cashflow: { month: string; income: number; expenses: number; net: number }[] = [];

  const [createOpen, setCreateOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<(typeof records)[0] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<(typeof records)[0] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    const result = await deleteFinancialRecord(deleteTarget.id, activityId);
    setDeletingId(null);
    setDeleteTarget(null);
    if (!result.ok) { toast.error(result.error); return; }
    setRecords((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    toast.success("Registrazione eliminata");
  }

  const totalRevenue = records
    .filter((r) => r.type === "revenue")
    .reduce((s, r) => s + r.amount, 0);
  const totalCosts = records
    .filter((r) => ["direct_cost", "indirect_cost"].includes(r.type))
    .reduce((s, r) => s + r.amount, 0);
  const totalInvestments = records
    .filter((r) => r.type === "investment")
    .reduce((s, r) => s + r.amount, 0);

  // Cost breakdown for pie
  const costCategories = records
    .filter((r) => ["direct_cost", "indirect_cost"].includes(r.type))
    .reduce((acc, r) => {
      acc[r.category] = (acc[r.category] ?? 0) + r.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(costCategories).map(([k, v]) => ({
    name: k,
    value: v,
  }));

  const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#06b6d4"];

  // Monthly P&L from cashflow
  const plData = cashflow.map((m) => ({
    month: m.month.slice(5),
    Revenue: m.income,
    Costi: m.expenses,
    Margine: m.net,
  }));

  const safeKpis = kpis ?? {
    totalRevenue: 0, totalCosts: 0, netMargin: 0, netMarginPct: 0,
    revenueGrowthRate: 0, costVariance: 0, ebitda: 0, ebitdaPct: 0,
    grossMargin: 0, grossMarginPct: 0, roi: 0, burnRate: 0, runwayMonths: 0,
    healthScore: 0, taskCompletionRate: 0, budgetUtilizationPct: 0,
    activeProjectsCount: 0, overdueTasksCount: 0, period: "",
  };

  return (
    <div className="space-y-6">
      {/* Activity header with CRUD actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{activity.name} — Finance</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{activity.sector}</p>
        </div>
        <ActivityActions activity={activity} showLabels />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat
          label="Revenue Totale"
          value={formatCurrency(safeKpis.totalRevenue, "EUR", true)}
          delta={safeKpis.revenueGrowthRate}
          icon={<TrendingUp className="h-4 w-4" />}
          accent="#10b981"
        />
        <Stat
          label="Costi Totali"
          value={formatCurrency(safeKpis.totalCosts, "EUR", true)}
          delta={-safeKpis.costVariance}
          icon={<TrendingDown className="h-4 w-4" />}
          accent="#f43f5e"
        />
        <Stat
          label="Margine Netto"
          value={formatCurrency(safeKpis.netMargin, "EUR", true)}
          delta={safeKpis.netMarginPct}
          deltaLabel={`${safeKpis.netMarginPct.toFixed(1)}% margine`}
          icon={<DollarSign className="h-4 w-4" />}
          accent="#6366f1"
        />
        <Stat
          label="EBITDA"
          value={formatCurrency(safeKpis.ebitda, "EUR", true)}
          delta={safeKpis.ebitdaPct}
          deltaLabel={`${safeKpis.ebitdaPct.toFixed(1)}% EBITDA margin`}
          icon={<TrendingUp className="h-4 w-4" />}
          accent="#f59e0b"
        />
      </div>

      {/* Advanced KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat
          label="ROI"
          value={`${safeKpis.roi.toFixed(1)}%`}
          delta={safeKpis.roi}
          size="sm"
          accent={safeKpis.roi >= 0 ? "#10b981" : "#f43f5e"}
        />
        <Stat
          label="Cash Flow"
          value={formatCurrency((safeKpis as import("@/types").ActivityKPIs).cashFlow ?? 0, "EUR", true)}
          delta={(safeKpis as import("@/types").ActivityKPIs).cashFlow ?? 0 > 0 ? 1 : -1}
          size="sm"
        />
        <Stat
          label="Burn Rate"
          value={formatCurrency(safeKpis.burnRate, "EUR", true) + "/m"}
          size="sm"
          accent={safeKpis.runwayMonths <= 6 ? "#f43f5e" : undefined}
        />
        <Stat
          label="Payback Period"
          value={(safeKpis as import("@/types").ActivityKPIs).paybackPeriodMonths > 0 ? `${(safeKpis as import("@/types").ActivityKPIs).paybackPeriodMonths}m` : "—"}
          size="sm"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cashflow.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>P&L Mensile</CardTitle>
              <span className="text-xs text-muted-foreground">Ultimi 12 mesi</span>
            </CardHeader>
            <ClientOnly fallback={<div className="h-[220px] bg-secondary/20 rounded animate-pulse" />}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={plData}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "#64748b" }}
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
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="Revenue" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={20} fillOpacity={0.8} />
                <Bar dataKey="Costi" fill="#f43f5e" radius={[3, 3, 0, 0]} maxBarSize={20} fillOpacity={0.6} />
                <Bar dataKey="Margine" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={20} fillOpacity={0.9} />
              </BarChart>
            </ResponsiveContainer>
            </ClientOnly>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Composizione Costi</CardTitle>
          </CardHeader>
          {pieData.length > 0 ? (
            <div>
              <ClientOnly fallback={<div className="h-[140px] bg-secondary/20 rounded animate-pulse" />}>
              <PieChart width={180} height={140} className="mx-auto">
                <Pie
                  data={pieData}
                  cx={85}
                  cy={65}
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
              </ClientOnly>
              <div className="space-y-1.5 mt-2">
                {pieData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-xs flex-1 capitalize">{item.name}</span>
                    <span className="text-xs font-medium tabular-nums">
                      {formatCurrency(item.value, "EUR", true)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">
              Nessun dato disponibile
            </p>
          )}
        </Card>
      </div>

      {/* Financial records table */}
      <Card>
        <CardHeader>
          <CardTitle>Registro Finanziario</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="neutral">{records.length} registrazioni</Badge>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Aggiungi
            </Button>
          </div>
        </CardHeader>
        <FinancialTable
          records={records}
          onEdit={(r) => setEditRecord(r)}
          onDelete={(r) => setDeleteTarget(r)}
        />
      </Card>

      {/* ── CRUD Modals ── */}
      <FinancialForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        activityId={activityId}
        projects={projects}
        onSuccess={(r) => setRecords((prev) => [r, ...prev])}
      />
      <FinancialForm
        open={!!editRecord}
        onClose={() => setEditRecord(null)}
        activityId={activityId}
        projects={projects}
        record={editRecord ?? undefined}
        onSuccess={(r) => setRecords((prev) => prev.map((x) => x.id === r.id ? r : x))}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Elimina registrazione"
        description={`Stai per eliminare "${deleteTarget?.description}" (${deleteTarget?.amount} ${deleteTarget?.currency}). Azione irreversibile.`}
        loading={deletingId === deleteTarget?.id}
      />

      {/* KPI formulas section */}
      <Card>
        <CardHeader>
          <CardTitle>Formula Engine — KPI Calcolati</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              label: "Margine Lordo",
              formula: "Revenue − Costi Diretti",
              value: formatCurrency(safeKpis.grossMargin ?? 0, "EUR", true),
              pct: `${(safeKpis.grossMarginPct ?? 0).toFixed(1)}%`,
            },
            {
              label: "EBITDA",
              formula: "Margine Lordo − Costi Indiretti",
              value: formatCurrency(safeKpis.ebitda, "EUR", true),
              pct: `${safeKpis.ebitdaPct.toFixed(1)}%`,
            },
            {
              label: "ROI",
              formula: "(Margine − Capitale) / Capitale × 100",
              value: `${(safeKpis.roi ?? 0).toFixed(2)}%`,
              pct: null,
            },
            {
              label: "Revenue Growth Rate",
              formula: "(Rev.corrente − Rev.precedente) / Rev.precedente × 100",
              value: `${safeKpis.revenueGrowthRate.toFixed(1)}%`,
              pct: null,
            },
            {
              label: "Burn Rate",
              formula: "Totale Costi / Mesi Periodo",
              value: formatCurrency(safeKpis.burnRate ?? 0, "EUR") + "/mese",
              pct: null,
            },
            {
              label: "Runway",
              formula: "Cash Disponibile / Burn Rate",
              value:
                (safeKpis.runwayMonths ?? 0) === Infinity || !safeKpis.runwayMonths
                  ? "∞"
                  : `${safeKpis.runwayMonths} mesi`,
              pct: null,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="p-3 rounded-lg bg-secondary/30 border border-border/30"
            >
              <p className="text-xs font-semibold text-foreground mb-0.5">
                {item.label}
              </p>
              <p className="text-[10px] font-mono text-muted-foreground mb-2">
                = {item.formula}
              </p>
              <p className="text-base font-bold tabular-nums">{item.value}</p>
              {item.pct && (
                <p className="text-xs text-muted-foreground">{item.pct} del revenue</p>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
