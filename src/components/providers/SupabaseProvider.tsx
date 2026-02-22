"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/app.store";
import { getActivities } from "@/actions/activities";

/**
 * Loads all activities from Supabase on first mount and syncs the Zustand store.
 * Mounted once in DashboardLayout.
 */
export function SupabaseProvider() {
  const { setActivities } = useAppStore();
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    getActivities().then((result) => {
      if (result.ok) {
        setActivities(result.data);
      }
    });
  }, [setActivities]);

  return null;
}
