// @ts-nocheck — remove after: npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts

"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { ok, fail, type ActionResult } from "./types";
import type { ForecastScenario, ScenarioType, ScenarioAssumptions, MonthlyProjection } from "@/types";

export interface CreateScenarioInput {
  activityId: string;
  name: string;
  type: ScenarioType;
  description?: string;
  assumptions: ScenarioAssumptions;
}

export interface UpdateScenarioInput extends Partial<CreateScenarioInput> {
  id: string;
  isActive?: boolean;
  projections?: MonthlyProjection[];
  projectedRevenue?: number;
  projectedCosts?: number;
  projectedMargin?: number;
  projectedMarginPct?: number;
  projectedROI?: number;
  breakEvenMonth?: string;
}

// ─────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────

export async function createScenario(
  input: CreateScenarioInput
): Promise<ActionResult<ForecastScenario>> {
  const supabase = createAdminClient();
const projections = computeProjections(input.assumptions);
  const summary = computeSummary(projections, input.assumptions);

  const { data, error } = await supabase
    .from("forecast_scenarios")
    .insert({
      activity_id: input.activityId,
      name: input.name.trim(),
      type: input.type,
      description: input.description?.trim() || null,
      is_active: false,
      assumptions: input.assumptions as unknown as Record<string, unknown>,
      projections: projections as unknown as Record<string, unknown>[],
      projected_revenue: summary.projectedRevenue,
      projected_costs: summary.projectedCosts,
      projected_margin: summary.projectedMargin,
      projected_margin_pct: summary.projectedMarginPct,
      projected_roi: summary.projectedROI,
      break_even_month: summary.breakEvenMonth || null,
    })
    .select()
    .single();

  if (error) return fail(error.message);

  revalidatePath(`/dashboard/${input.activityId}/simulations`);
  return ok(mapScenario(data));
}

// ─────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────

export async function getScenarios(activityId: string): Promise<ActionResult<ForecastScenario[]>> {
  const supabase = createAdminClient();
const { data, error } = await supabase
    .from("forecast_scenarios")
    .select("*")
    .eq("activity_id", activityId)
    .order("created_at", { ascending: false });

  if (error) return fail(error.message);
  return ok((data ?? []).map(mapScenario));
}

// ─────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────

export async function updateScenario(
  input: UpdateScenarioInput
): Promise<ActionResult<ForecastScenario>> {
  const supabase = createAdminClient();
const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.description !== undefined) patch.description = input.description.trim() || null;
  if (input.type !== undefined) patch.type = input.type;
  if (input.isActive !== undefined) patch.is_active = input.isActive;
  if (input.assumptions !== undefined) {
    patch.assumptions = input.assumptions as unknown as Record<string, unknown>;
    // recompute projections when assumptions change
    const proj = computeProjections(input.assumptions);
    const sum = computeSummary(proj, input.assumptions);
    patch.projections = proj as unknown as Record<string, unknown>[];
    patch.projected_revenue = sum.projectedRevenue;
    patch.projected_costs = sum.projectedCosts;
    patch.projected_margin = sum.projectedMargin;
    patch.projected_margin_pct = sum.projectedMarginPct;
    patch.projected_roi = sum.projectedROI;
    patch.break_even_month = sum.breakEvenMonth || null;
  }

  const { data, error } = await supabase
    .from("forecast_scenarios")
    .update(patch)
    .eq("id", input.id)
    .select()
    .single();

  if (error) return fail(error.message);

  const activityId = data.activity_id as string;
  revalidatePath(`/dashboard/${activityId}/simulations`);
  return ok(mapScenario(data));
}

// ─────────────────────────────────────────────
// SET ACTIVE (only one active per activity)
// ─────────────────────────────────────────────

export async function setActiveScenario(
  id: string,
  activityId: string
): Promise<ActionResult<void>> {
  const supabase = createAdminClient();
// Deactivate all
  await supabase
    .from("forecast_scenarios")
    .update({ is_active: false })
    .eq("activity_id", activityId);

  // Activate target
  const { error } = await supabase
    .from("forecast_scenarios")
    .update({ is_active: true })
    .eq("id", id);

  if (error) return fail(error.message);

  revalidatePath(`/dashboard/${activityId}/simulations`);
  return ok(undefined);
}

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────

export async function deleteScenario(
  id: string,
  activityId: string
): Promise<ActionResult<void>> {
  const supabase = createAdminClient();
const { error } = await supabase
    .from("forecast_scenarios")
    .delete()
    .eq("id", id);

  if (error) return fail(error.message);

  revalidatePath(`/dashboard/${activityId}/simulations`);
  return ok(undefined);
}

// ─────────────────────────────────────────────
// PROJECTION ENGINE
// ─────────────────────────────────────────────

function computeProjections(
  assumptions: ScenarioAssumptions,
  months = 12,
  startingRevenue = 15000
): MonthlyProjection[] {
  const projections: MonthlyProjection[] = [];
  const now = new Date();
  let revenue = startingRevenue;
  let costs = startingRevenue * 0.55;
  let customers = Math.max(1, assumptions.newCustomersPerMonth * 3);
  let cumCashFlow = 0;

  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    // Revenue: grow by rate + new customers * AOV - churn
    revenue = revenue * (1 + assumptions.revenueGrowthRate / 100);
    const newRevFromCustomers = assumptions.newCustomersPerMonth * assumptions.averageOrderValue;
    revenue += newRevFromCustomers;

    // Costs: inflate + marketing + hiring
    const hiringCost = assumptions.hiringPlan
      .filter((h) => h.month === month)
      .reduce((s, h) => s + h.monthlyCost, 0);
    costs = costs * (1 + assumptions.costInflationRate / 100 / 12) + assumptions.marketingSpend + hiringCost;

    // Customers
    customers = Math.floor(customers * (1 - assumptions.churnRate / 100) + assumptions.newCustomersPerMonth);

    const margin = revenue - costs;
    cumCashFlow += margin;

    projections.push({
      month,
      revenue: Math.round(revenue),
      costs: Math.round(costs),
      margin: Math.round(margin),
      cashFlow: Math.round(margin),
      cumulativeCashFlow: Math.round(cumCashFlow),
      customers,
    });
  }

  return projections;
}

function computeSummary(
  projections: MonthlyProjection[],
  assumptions: ScenarioAssumptions
): {
  projectedRevenue: number;
  projectedCosts: number;
  projectedMargin: number;
  projectedMarginPct: number;
  projectedROI: number;
  breakEvenMonth?: string;
} {
  const projectedRevenue = projections.reduce((s, p) => s + p.revenue, 0);
  const projectedCosts = projections.reduce((s, p) => s + p.costs, 0);
  const projectedMargin = projectedRevenue - projectedCosts;
  const projectedMarginPct =
    projectedRevenue > 0 ? (projectedMargin / projectedRevenue) * 100 : 0;
  const capitalInvested = assumptions.marketingSpend * 12 + 10000;
  const projectedROI =
    capitalInvested > 0
      ? ((projectedMargin - capitalInvested) / capitalInvested) * 100
      : 0;

  const breakEvenProj = projections.find((p) => p.cumulativeCashFlow > 0);
  const breakEvenMonth = breakEvenProj?.month;

  return {
    projectedRevenue: Math.round(projectedRevenue),
    projectedCosts: Math.round(projectedCosts),
    projectedMargin: Math.round(projectedMargin),
    projectedMarginPct: Math.round(projectedMarginPct * 10) / 10,
    projectedROI: Math.round(projectedROI * 10) / 10,
    breakEvenMonth,
  };
}

// ─────────────────────────────────────────────
// MAPPER
// ─────────────────────────────────────────────

function normalizeProjections(raw: unknown[]): MonthlyProjection[] {
  return (raw ?? []).map((p: Record<string, unknown>) => {
    const rev = Number(p.revenue ?? 0);
    const cost = Number(p.costs ?? 0);
    const margin = Number(p.margin ?? rev - cost);
    const cumFromRevCost = Number(p.cumulativeRevenue ?? 0) - Number(p.cumulativeCosts ?? 0);
    const cum = Number(p.cumulativeCashFlow ?? (Number.isFinite(cumFromRevCost) ? cumFromRevCost : margin));
    return {
      month: String(p.month ?? ""),
      revenue: rev,
      costs: cost,
      margin,
      cashFlow: margin,
      cumulativeCashFlow: cum,
      customers: Number(p.customers ?? 0),
    };
  });
}

function mapScenario(row: Record<string, unknown>): ForecastScenario {
  return {
    id: row.id as string,
    activityId: row.activity_id as string,
    name: row.name as string,
    type: row.type as ScenarioType,
    description: row.description as string | undefined,
    isActive: row.is_active as boolean,
    assumptions: row.assumptions as ScenarioAssumptions,
    projections: normalizeProjections((row.projections as unknown[]) ?? []),
    projectedRevenue: Number(row.projected_revenue),
    projectedCosts: Number(row.projected_costs),
    projectedMargin: Number(row.projected_margin),
    projectedMarginPct: Number(row.projected_margin_pct),
    projectedROI: Number(row.projected_roi),
    breakEvenMonth: row.break_even_month as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
