import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─────────────────────────────────────────────
// NUMBER FORMATTING
// ─────────────────────────────────────────────

export function formatCurrency(
  value: number,
  currency: string = "EUR",
  compact = false
): string {
  if (compact && Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M ${currency}`;
  }
  if (compact && Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K ${currency}`;
  }
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (compact && Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat("it-IT").format(value);
}

export function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─────────────────────────────────────────────
// DATE UTILITIES
// ─────────────────────────────────────────────

export function formatDate(date: string | Date, format: "short" | "long" | "relative" = "short"): string {
  const d = typeof date === "string" ? new Date(date) : date;

  if (format === "relative") {
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Oggi";
    if (days === 1) return "Ieri";
    if (days === -1) return "Domani";
    if (days > 0 && days < 7) return `${days}g fa`;
    if (days < 0 && days > -7) return `tra ${Math.abs(days)}g`;
  }

  if (format === "long") {
    return d.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function daysUntil(date: string): number {
  const target = new Date(date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function isOverdue(deadline: string): boolean {
  return daysUntil(deadline) < 0;
}

export function monthsRange(startMonth: string, count: number): string[] {
  const months: string[] = [];
  const [year, month] = startMonth.split("-").map(Number);
  for (let i = 0; i < count; i++) {
    const d = new Date(year, month - 1 + i, 1);
    months.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }
  return months;
}

// ─────────────────────────────────────────────
// BUSINESS CALCULATIONS
// ─────────────────────────────────────────────

export function calculateROI(gain: number, investment: number): number {
  if (investment === 0) return 0;
  return ((gain - investment) / investment) * 100;
}

export function calculateMargin(revenue: number, costs: number): number {
  if (revenue === 0) return 0;
  return ((revenue - costs) / revenue) * 100;
}

export function calculateBurnRate(
  costs: CostEntry[],
  periodMonths: number
): number {
  const total = costs.reduce((sum, c) => sum + c.amount, 0);
  return total / periodMonths;
}

export function calculateRunway(cash: number, burnRate: number): number {
  if (burnRate <= 0) return Infinity;
  return cash / burnRate;
}

export function calculateBreakEven(
  fixedCosts: number,
  pricePerUnit: number,
  variableCostPerUnit: number
): number {
  const contribution = pricePerUnit - variableCostPerUnit;
  if (contribution <= 0) return Infinity;
  return fixedCosts / contribution;
}

export function calculateHealthScore(params: {
  roi: number;
  marginPct: number;
  completionPct: number;
  budgetVariancePct: number;
  overdueTasksPct: number;
}): number {
  const roiScore = Math.min(Math.max((params.roi / 30) * 25, 0), 25);
  const marginScore = Math.min(Math.max((params.marginPct / 40) * 25, 0), 25);
  const completionScore = (params.completionPct / 100) * 20;
  const budgetScore = Math.max(
    0,
    20 - Math.abs(params.budgetVariancePct) * 0.5
  );
  const taskScore = Math.max(0, 10 - params.overdueTasksPct * 0.2);

  return Math.round(roiScore + marginScore + completionScore + budgetScore + taskScore);
}

interface CostEntry {
  amount: number;
}

// ─────────────────────────────────────────────
// COLOR UTILITIES
// ─────────────────────────────────────────────

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    completed: "text-emerald-400",
    done: "text-emerald-400",
    in_progress: "text-blue-400",
    planning: "text-violet-400",
    backlog: "text-slate-400",
    on_hold: "text-amber-400",
    cancelled: "text-red-400",
    blocked: "text-red-400",
    todo: "text-slate-400",
    review: "text-cyan-400",
  };
  return colors[status] ?? "text-slate-400";
}

export function getStatusBg(status: string): string {
  const colors: Record<string, string> = {
    completed: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    done: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    in_progress: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
    planning: "bg-violet-500/10 text-violet-400 ring-violet-500/20",
    backlog: "bg-slate-500/10 text-slate-400 ring-slate-500/20",
    on_hold: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
    cancelled: "bg-red-500/10 text-red-400 ring-red-500/20",
    blocked: "bg-red-500/10 text-red-400 ring-red-500/20",
    todo: "bg-slate-500/10 text-slate-400 ring-slate-500/20",
    review: "bg-cyan-500/10 text-cyan-400 ring-cyan-500/20",
  };
  return colors[status] ?? "bg-slate-500/10 text-slate-400 ring-slate-500/20";
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    critical: "text-red-400",
    high: "text-orange-400",
    medium: "text-amber-400",
    low: "text-slate-400",
  };
  return colors[priority] ?? "text-slate-400";
}

export function getPriorityBg(priority: string): string {
  const colors: Record<string, string> = {
    critical: "bg-red-500/10 text-red-400 ring-red-500/20",
    high: "bg-orange-500/10 text-orange-400 ring-orange-500/20",
    medium: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
    low: "bg-slate-500/10 text-slate-400 ring-slate-500/20",
  };
  return colors[priority] ?? "bg-slate-500/10 text-slate-400 ring-slate-500/20";
}

export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    critical: "text-red-400",
    warning: "text-amber-400",
    info: "text-blue-400",
    success: "text-emerald-400",
  };
  return colors[severity] ?? "text-slate-400";
}

export function getSeverityBg(severity: string): string {
  const colors: Record<string, string> = {
    critical: "bg-red-500/10 border-red-500/30",
    warning: "bg-amber-500/10 border-amber-500/30",
    info: "bg-blue-500/10 border-blue-500/30",
    success: "bg-emerald-500/10 border-emerald-500/30",
  };
  return colors[severity] ?? "bg-slate-500/10 border-slate-500/30";
}

export function getKPITrend(value: number): "up" | "down" | "neutral" {
  if (value > 1) return "up";
  if (value < -1) return "down";
  return "neutral";
}

export function getScoreColor(score: number): string {
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  if (score >= 25) return "text-orange-400";
  return "text-red-400";
}

export function getScoreGradient(score: number): string {
  if (score >= 75) return "from-emerald-500 to-emerald-400";
  if (score >= 50) return "from-amber-500 to-amber-400";
  if (score >= 25) return "from-orange-500 to-orange-400";
  return "from-red-500 to-red-400";
}
