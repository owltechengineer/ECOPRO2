// @ts-nocheck — remove after: npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts

"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { ok, fail, type ActionResult } from "./types";
import type { Task, ProjectPriority, TaskStatus } from "@/types";

export interface CreateTaskInput {
  projectId: string;
  activityId: string;
  name: string;
  description?: string;
  status: TaskStatus;
  priority: ProjectPriority;
  owner?: string;
  estimatedHours: number;
  startDate?: string;
  deadline: string;
  tags?: string[];
}

export interface UpdateTaskInput extends Partial<Omit<CreateTaskInput, "projectId" | "activityId">> {
  id: string;
  actualHours?: number;
  completionPct?: number;
  dependencies?: string[];
}

// ─────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────

export async function createTask(
  input: CreateTaskInput
): Promise<ActionResult<Task>> {
  const supabase = createAdminClient();
const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: input.projectId,
      activity_id: input.activityId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      status: input.status,
      priority: input.priority,
      owner: input.owner?.trim() || null,
      estimated_hours: input.estimatedHours,
      actual_hours: 0,
      start_date: input.startDate || null,
      deadline: input.deadline,
      completion_pct: 0,
      tags: input.tags ?? [],
    })
    .select()
    .single();

  if (error) return fail(error.message);

  revalidatePath(`/dashboard/${input.activityId}/projects`);
  revalidatePath(`/dashboard/${input.activityId}`);
  return ok(mapTask(data));
}

// ─────────────────────────────────────────────
// READ (by activity)
// ─────────────────────────────────────────────

export async function getTasks(activityId: string): Promise<ActionResult<Task[]>> {
  const supabase = createAdminClient();
const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("activity_id", activityId)
    .order("deadline", { ascending: true });

  if (error) return fail(error.message);
  return ok((data ?? []).map(mapTask));
}

// READ (by project)
export async function getTasksByProject(projectId: string): Promise<ActionResult<Task[]>> {
  const supabase = createAdminClient();
const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("deadline", { ascending: true });

  if (error) return fail(error.message);
  return ok((data ?? []).map(mapTask));
}

// ─────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────

export async function updateTask(
  input: UpdateTaskInput
): Promise<ActionResult<Task>> {
  const supabase = createAdminClient();
const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.description !== undefined) patch.description = input.description.trim() || null;
  if (input.status !== undefined) patch.status = input.status;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.owner !== undefined) patch.owner = input.owner.trim() || null;
  if (input.estimatedHours !== undefined) patch.estimated_hours = input.estimatedHours;
  if (input.actualHours !== undefined) patch.actual_hours = input.actualHours;
  if (input.startDate !== undefined) patch.start_date = input.startDate || null;
  if (input.deadline !== undefined) patch.deadline = input.deadline;
  if (input.completionPct !== undefined) patch.completion_pct = Math.min(100, Math.max(0, input.completionPct));
  if (input.tags !== undefined) patch.tags = input.tags;
  if (input.dependencies !== undefined) patch.dependencies = input.dependencies;

  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", input.id)
    .select()
    .single();

  if (error) return fail(error.message);

  const activityId = data.activity_id as string;
  revalidatePath(`/dashboard/${activityId}/projects`);
  revalidatePath(`/dashboard/${activityId}`);
  return ok(mapTask(data));
}

// ─────────────────────────────────────────────
// UPDATE STATUS (quick action)
// ─────────────────────────────────────────────

export async function updateTaskStatus(
  id: string,
  status: TaskStatus,
  activityId: string
): Promise<ActionResult<void>> {
  const supabase = createAdminClient();
const completionPct = status === "done" ? 100 : status === "in_progress" ? 50 : 0;

  const { error } = await supabase
    .from("tasks")
    .update({ status, completion_pct: completionPct })
    .eq("id", id);

  if (error) return fail(error.message);

  revalidatePath(`/dashboard/${activityId}/projects`);
  return ok(undefined);
}

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────

export async function deleteTask(
  id: string,
  activityId: string
): Promise<ActionResult<void>> {
  const supabase = createAdminClient();
const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id);

  if (error) return fail(error.message);

  revalidatePath(`/dashboard/${activityId}/projects`);
  revalidatePath(`/dashboard/${activityId}`);
  return ok(undefined);
}

// ─────────────────────────────────────────────
// MAPPER
// ─────────────────────────────────────────────

function mapTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    activityId: row.activity_id as string,
    name: row.name as string,
    description: row.description as string | undefined,
    status: row.status as TaskStatus,
    priority: row.priority as ProjectPriority,
    owner: row.owner as string | undefined,
    estimatedHours: Number(row.estimated_hours),
    actualHours: Number(row.actual_hours),
    startDate: row.start_date as string,
    deadline: row.deadline as string,
    completionPct: Number(row.completion_pct),
    dependencies: (row.dependencies as string[]) ?? [],
    tags: (row.tags as string[]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
