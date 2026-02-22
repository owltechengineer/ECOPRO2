// @ts-nocheck — remove after: npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts

"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { ok, fail, type ActionResult } from "./types";
import type { Project, ProjectMethodology, ProjectPriority, ProjectStatus } from "@/types";

export interface CreateProjectInput {
  activityId: string;
  name: string;
  description?: string;
  methodology: ProjectMethodology;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: string;
  endDate: string;
  budgetEstimated: number;
  revenueEstimated: number;
  tags?: string[];
}

export interface UpdateProjectInput extends Partial<Omit<CreateProjectInput, "activityId">> {
  id: string;
  budgetActual?: number;
  revenueActual?: number;
  completionPct?: number;
  actualEndDate?: string;
}

// ─────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────

export async function createProject(
  input: CreateProjectInput
): Promise<ActionResult<Project>> {
  const supabase = createAdminClient();
const { data, error } = await supabase
    .from("projects")
    .insert({
      activity_id: input.activityId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      methodology: input.methodology,
      status: input.status,
      priority: input.priority,
      start_date: input.startDate,
      end_date: input.endDate,
      budget_estimated: input.budgetEstimated,
      budget_actual: 0,
      revenue_estimated: input.revenueEstimated,
      revenue_actual: 0,
      completion_pct: 0,
      tags: input.tags ?? [],
    })
    .select()
    .single();

  if (error) return fail(error.message);

  revalidatePath(`/dashboard/${input.activityId}/projects`);
  revalidatePath(`/dashboard/${input.activityId}`);
  return ok(mapProject(data));
}

// ─────────────────────────────────────────────
// READ (by activity)
// ─────────────────────────────────────────────

export async function getProjects(activityId: string): Promise<ActionResult<Project[]>> {
  const supabase = createAdminClient();
const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("activity_id", activityId)
    .order("created_at", { ascending: false });

  if (error) return fail(error.message);
  return ok((data ?? []).map(mapProject));
}

// ─────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────

export async function updateProject(
  input: UpdateProjectInput
): Promise<ActionResult<Project>> {
  const supabase = createAdminClient();
const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.description !== undefined) patch.description = input.description.trim() || null;
  if (input.methodology !== undefined) patch.methodology = input.methodology;
  if (input.status !== undefined) patch.status = input.status;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.startDate !== undefined) patch.start_date = input.startDate;
  if (input.endDate !== undefined) patch.end_date = input.endDate;
  if (input.actualEndDate !== undefined) patch.actual_end_date = input.actualEndDate;
  if (input.budgetEstimated !== undefined) patch.budget_estimated = input.budgetEstimated;
  if (input.budgetActual !== undefined) patch.budget_actual = input.budgetActual;
  if (input.revenueEstimated !== undefined) patch.revenue_estimated = input.revenueEstimated;
  if (input.revenueActual !== undefined) patch.revenue_actual = input.revenueActual;
  if (input.completionPct !== undefined) patch.completion_pct = input.completionPct;
  if (input.tags !== undefined) patch.tags = input.tags;

  const { data, error } = await supabase
    .from("projects")
    .update(patch)
    .eq("id", input.id)
    .select()
    .single();

  if (error) return fail(error.message);

  const activityId = data.activity_id as string;
  revalidatePath(`/dashboard/${activityId}/projects`);
  revalidatePath(`/dashboard/${activityId}`);
  return ok(mapProject(data));
}

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────

export async function deleteProject(
  id: string,
  activityId: string
): Promise<ActionResult<void>> {
  const supabase = createAdminClient();
const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id);

  if (error) return fail(error.message);

  revalidatePath(`/dashboard/${activityId}/projects`);
  revalidatePath(`/dashboard/${activityId}`);
  return ok(undefined);
}

// ─────────────────────────────────────────────
// UPDATE COMPLETION % (quick action)
// ─────────────────────────────────────────────

export async function updateProjectCompletion(
  id: string,
  completionPct: number,
  activityId: string
): Promise<ActionResult<void>> {
  const supabase = createAdminClient();
const { error } = await supabase
    .from("projects")
    .update({ completion_pct: Math.min(100, Math.max(0, completionPct)) })
    .eq("id", id);

  if (error) return fail(error.message);

  revalidatePath(`/dashboard/${activityId}/projects`);
  return ok(undefined);
}

// ─────────────────────────────────────────────
// MAPPER
// ─────────────────────────────────────────────

function mapProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    activityId: row.activity_id as string,
    name: row.name as string,
    description: row.description as string | undefined,
    methodology: row.methodology as ProjectMethodology,
    status: row.status as ProjectStatus,
    priority: row.priority as ProjectPriority,
    ownerId: row.owner_id as string,
    startDate: row.start_date as string,
    endDate: row.end_date as string,
    actualEndDate: row.actual_end_date as string | undefined,
    budgetEstimated: Number(row.budget_estimated),
    budgetActual: Number(row.budget_actual),
    revenueEstimated: Number(row.revenue_estimated),
    revenueActual: Number(row.revenue_actual),
    completionPct: Number(row.completion_pct),
    tags: (row.tags as string[]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
