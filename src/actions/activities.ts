// @ts-nocheck — remove after: npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { ok, fail, type ActionResult } from "./types";
import type { Activity, ActivitySettings, BusinessModel, LifecycleStage } from "@/types";

export interface CreateActivityInput {
  name: string;
  description?: string;
  sector: string;
  businessModels: BusinessModel[];
  geography: string[];
  lifecycleStage: LifecycleStage;
  capitalInvested: number;
  weeklyTimeAllocated: number;
  color: string;
}

export interface UpdateActivityInput extends Partial<CreateActivityInput> {
  id: string;
  isActive?: boolean;
  settings?: Partial<ActivitySettings>;
}

// ─────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────

export async function createActivity(
  input: CreateActivityInput
): Promise<ActionResult<Activity>> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("activities")
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      sector: input.sector,
      business_models: input.businessModels,
      geography: input.geography,
      lifecycle_stage: input.lifecycleStage,
      capital_invested: input.capitalInvested,
      weekly_time_allocated: input.weeklyTimeAllocated,
      color: input.color,
    })
    .select()
    .single();

  if (error) return fail(error.message);

  revalidatePath("/dashboard");
  return ok(mapActivity(data));
}

// ─────────────────────────────────────────────
// READ ALL
// ─────────────────────────────────────────────

export async function getActivities(): Promise<ActionResult<Activity[]>> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return fail(error.message);
  const activities = (data ?? []).map(mapActivity);

  const { data: summaryData } = await supabase
    .from("activity_financial_summary")
    .select("activity_id, total_revenue, total_costs, gross_margin, capital_invested");

  const summaryMap = new Map<string, { total_revenue: number; total_costs: number; gross_margin: number; capital_invested: number }>();
  (summaryData ?? []).forEach((r: { activity_id: string; total_revenue: number; total_costs: number; gross_margin: number; capital_invested: number }) => {
    summaryMap.set(r.activity_id, {
      total_revenue: Number(r.total_revenue),
      total_costs: Number(r.total_costs),
      gross_margin: Number(r.gross_margin),
      capital_invested: Number(r.capital_invested),
    });
  });

  const enriched = activities.map((a) => {
    const s = summaryMap.get(a.id);
    if (!s || (s.total_revenue === 0 && s.total_costs === 0)) return a;
    const grossMarginPct = s.total_revenue > 0 ? (s.gross_margin / s.total_revenue) * 100 : 0;
    const roi = s.capital_invested > 0 ? (s.gross_margin / s.capital_invested) * 100 : 0;
    const burnRate = 12 > 0 ? s.total_costs / 12 : 0;
    const runwayMonths = burnRate > 0 ? s.gross_margin / burnRate : Infinity;
    const healthScore = Math.min(100, Math.max(0, 50 + roi * 0.5 + grossMarginPct * 0.3));
    return {
      ...a,
      kpis: {
        totalRevenue: s.total_revenue,
        totalCosts: s.total_costs,
        grossMargin: s.gross_margin,
        grossMarginPct,
        netMargin: s.gross_margin,
        netMarginPct: grossMarginPct,
        ebitda: s.gross_margin,
        ebitdaPct: grossMarginPct,
        roi,
        paybackPeriodMonths: 0,
        cashFlow: s.gross_margin,
        burnRate,
        runwayMonths,
        revenueGrowthRate: 0,
        costVariance: 0,
        revenueVariance: 0,
        productivityIndex: 0,
        healthScore,
        budgetUtilizationPct: 0,
        period: "",
      },
    };
  });

  return ok(enriched);
}

// ─────────────────────────────────────────────
// READ ONE
// ─────────────────────────────────────────────

export async function getActivity(id: string): Promise<ActionResult<Activity>> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return fail(error.message);
  return ok(mapActivity(data));
}

// ─────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────

export async function updateActivity(
  input: UpdateActivityInput
): Promise<ActionResult<Activity>> {
  const supabase = createAdminClient();

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.description !== undefined) patch.description = input.description.trim() || null;
  if (input.sector !== undefined) patch.sector = input.sector;
  if (input.businessModels !== undefined) patch.business_models = input.businessModels;
  if (input.geography !== undefined) patch.geography = input.geography;
  if (input.lifecycleStage !== undefined) patch.lifecycle_stage = input.lifecycleStage;
  if (input.capitalInvested !== undefined) patch.capital_invested = input.capitalInvested;
  if (input.weeklyTimeAllocated !== undefined) patch.weekly_time_allocated = input.weeklyTimeAllocated;
  if (input.color !== undefined) patch.color = input.color;
  if (input.isActive !== undefined) patch.is_active = input.isActive;
  if (input.settings !== undefined) {
    const { data: existing } = await supabase
      .from("activities")
      .select("settings")
      .eq("id", input.id)
      .single();
    patch.settings = { ...(existing?.settings as object ?? {}), ...input.settings };
  }

  const { data, error } = await supabase
    .from("activities")
    .update(patch)
    .eq("id", input.id)
    .select()
    .single();

  if (error) return fail(error.message);

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${input.id}`);
  return ok(mapActivity(data));
}

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────

export async function deleteActivity(id: string): Promise<ActionResult<void>> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("activities")
    .delete()
    .eq("id", id);

  if (error) return fail(error.message);

  revalidatePath("/dashboard");
  return ok(undefined);
}

// ─────────────────────────────────────────────
// TOGGLE ACTIVE
// ─────────────────────────────────────────────

export async function toggleActivityActive(
  id: string,
  isActive: boolean
): Promise<ActionResult<void>> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("activities")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return fail(error.message);

  revalidatePath("/dashboard");
  return ok(undefined);
}

// ─────────────────────────────────────────────
// MAPPER
// ─────────────────────────────────────────────

function mapActivity(row: Record<string, unknown>): Activity {
  return {
    id: row.id as string,
    userId: (row.user_id as string) ?? "",
    name: row.name as string,
    description: row.description as string | undefined,
    sector: row.sector as string,
    businessModels: (row.business_models as string[]) as BusinessModel[],
    geography: row.geography as string[],
    lifecycleStage: row.lifecycle_stage as LifecycleStage,
    capitalInvested: Number(row.capital_invested),
    weeklyTimeAllocated: Number(row.weekly_time_allocated),
    color: row.color as string,
    icon: row.icon as string | undefined,
    isActive: row.is_active as boolean,
    settings: row.settings as Activity["settings"],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
