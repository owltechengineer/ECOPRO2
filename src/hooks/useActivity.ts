"use client";

import { useAppStore } from "@/store/app.store";
import type { Activity } from "@/types";

/**
 * Looks up an activity by ID from the Zustand store (which is populated from Supabase).
 */
export function useActivity(activityId: string): Activity | null {
  return useAppStore((s) => s.activities.find((a) => a.id === activityId) ?? null);
}
