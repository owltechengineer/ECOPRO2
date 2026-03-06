// @ts-nocheck — remove after: npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts

"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { ok, fail, type ActionResult } from "./types";
import type { FinancialRecord, FinancialRecordType, FinancialCategory, FinancialReminderType } from "@/types";

export interface CreateFinancialInput {
  activityId: string;
  projectId?: string;
  type: FinancialRecordType;
  category: FinancialCategory;
  description: string;
  amount: number;
  currency?: string;
  date: string;
  isRecurring?: boolean;
  recurringInterval?: "monthly" | "quarterly" | "annual";
  invoiceRef?: string;
  tags?: string[];
  isReminder?: boolean;
  reminderType?: FinancialReminderType;
  reminderDueDate?: string;
}

export interface UpdateFinancialInput extends Partial<CreateFinancialInput> {
  id: string;
}

// ─────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────

export async function createFinancialRecord(
  input: CreateFinancialInput
): Promise<ActionResult<FinancialRecord>> {
  const supabase = createAdminClient();
const { data, error } = await supabase
    .from("financial_records")
    .insert({
      activity_id: input.activityId,
      project_id: input.projectId || null,
      type: input.type,
      category: input.category,
      description: input.description.trim(),
      amount: input.amount,
      currency: input.currency ?? "EUR",
      date: input.date,
      is_recurring: input.isRecurring ?? false,
      recurring_interval: input.recurringInterval || null,
      invoice_ref: input.invoiceRef?.trim() || null,
      tags: input.tags ?? [],
      is_reminder: input.isReminder ?? false,
      reminder_type: input.reminderType || null,
      reminder_due_date: input.reminderDueDate || null,
    })
    .select()
    .single();

  if (error) return fail(error.message);

  revalidatePath(`/dashboard/${input.activityId}/finance`);
  revalidatePath(`/dashboard/${input.activityId}`);
  return ok(mapRecord(data));
}

// ─────────────────────────────────────────────
// READ (by activity)
// ─────────────────────────────────────────────

export async function getFinancialRecords(
  activityId: string
): Promise<ActionResult<FinancialRecord[]>> {
  const supabase = createAdminClient();
const { data, error } = await supabase
    .from("financial_records")
    .select("*")
    .eq("activity_id", activityId)
    .order("date", { ascending: false });

  if (error) return fail(error.message);
  return ok((data ?? []).map(mapRecord));
}

// ─────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────

export async function updateFinancialRecord(
  input: UpdateFinancialInput
): Promise<ActionResult<FinancialRecord>> {
  const supabase = createAdminClient();
const patch: Record<string, unknown> = {};
  if (input.type !== undefined) patch.type = input.type;
  if (input.category !== undefined) patch.category = input.category;
  if (input.description !== undefined) patch.description = input.description.trim();
  if (input.amount !== undefined) patch.amount = input.amount;
  if (input.currency !== undefined) patch.currency = input.currency;
  if (input.date !== undefined) patch.date = input.date;
  if (input.isRecurring !== undefined) patch.is_recurring = input.isRecurring;
  if (input.recurringInterval !== undefined) patch.recurring_interval = input.recurringInterval;
  if (input.invoiceRef !== undefined) patch.invoice_ref = input.invoiceRef.trim() || null;
  if (input.projectId !== undefined) patch.project_id = input.projectId || null;
  if (input.tags !== undefined) patch.tags = input.tags;
  if (input.isReminder !== undefined) patch.is_reminder = input.isReminder;
  if (input.reminderType !== undefined) patch.reminder_type = input.reminderType || null;
  if (input.reminderDueDate !== undefined) patch.reminder_due_date = input.reminderDueDate || null;

  const { data, error } = await supabase
    .from("financial_records")
    .update(patch)
    .eq("id", input.id)
    .select()
    .single();

  if (error) return fail(error.message);

  const activityId = data.activity_id as string;
  revalidatePath(`/dashboard/${activityId}/finance`);
  return ok(mapRecord(data));
}

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────

export async function deleteFinancialRecord(
  id: string,
  activityId: string
): Promise<ActionResult<void>> {
  const supabase = createAdminClient();
const { error } = await supabase
    .from("financial_records")
    .delete()
    .eq("id", id);

  if (error) return fail(error.message);

  revalidatePath(`/dashboard/${activityId}/finance`);
  revalidatePath(`/dashboard/${activityId}`);
  return ok(undefined);
}

// ─────────────────────────────────────────────
// MAPPER
// ─────────────────────────────────────────────

function mapRecord(row: Record<string, unknown>): FinancialRecord {
  return {
    id: row.id as string,
    activityId: row.activity_id as string,
    projectId: row.project_id as string | undefined,
    type: row.type as FinancialRecordType,
    category: row.category as FinancialCategory,
    description: row.description as string,
    amount: Number(row.amount),
    currency: (row.currency as string) as FinancialRecord["currency"],
    date: row.date as string,
    isRecurring: row.is_recurring as boolean,
    recurringInterval: row.recurring_interval as FinancialRecord["recurringInterval"],
    invoiceRef: row.invoice_ref as string | undefined,
    tags: (row.tags as string[]) ?? [],
    isReminder: row.is_reminder as boolean | undefined,
    reminderType: row.reminder_type as FinancialRecord["reminderType"],
    reminderDueDate: row.reminder_due_date as string | undefined,
    createdAt: row.created_at as string,
  };
}

// ─────────────────────────────────────────────
// REMINDERS (for header notifications)
// ─────────────────────────────────────────────

/** Reminder display item for notifications panel */
export interface FinancialReminderDisplay {
  id: string;
  activityId: string;
  title: string;
  message: string;
  amount: number;
  currency: string;
  reminderType: FinancialReminderType;
  dueDate?: string;
  createdAt: string;
}

// Activity IDs come from store - we need to fetch across all user activities
export async function getFinancialReminders(
  activityIds: string[]
): Promise<ActionResult<FinancialReminderDisplay[]>> {
  if (activityIds.length === 0) return ok([]);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("financial_records")
    .select("id, activity_id, description, amount, currency, reminder_type, reminder_due_date, created_at")
    .eq("is_reminder", true)
    .in("activity_id", activityIds)
    .order("reminder_due_date", { ascending: true, nullsFirst: false });

  if (error) return fail(error.message);

  const labels: Record<string, string> = {
    person_to_pay: "Persona da pagare",
    thing_to_buy: "Acquisto da fare",
    payment_due: "Scadenza pagamento",
    other: "Promemoria",
  };

  const items: FinancialReminderDisplay[] = (data ?? []).map((r) => {
    const type = (r.reminder_type as FinancialReminderType) || "other";
    return {
      id: r.id,
      activityId: r.activity_id,
      title: labels[type] ?? type,
      message: r.description,
      amount: Number(r.amount),
      currency: r.currency ?? "EUR",
      reminderType: type,
      dueDate: r.reminder_due_date,
      createdAt: r.created_at,
    };
  });

  return ok(items);
}
