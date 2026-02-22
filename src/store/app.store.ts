import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Activity, User } from "@/types";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function generateId(): string {
  return `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function now(): string {
  return new Date().toISOString();
}

// ─────────────────────────────────────────────
// State shape
// ─────────────────────────────────────────────

interface AppState {
  currentUser: User | null;
  currentActivityId: string | null;
  activities: Activity[];
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  // Lifecycle
  setCurrentUser: (user: User | null) => void;
  setCurrentActivity: (id: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Activity CRUD
  // Accepts a full Activity (from DB) or a partial one (local-only fallback)
  addActivity: (input: Activity | Omit<Activity, "id" | "userId" | "createdAt" | "updatedAt" | "isActive">) => Activity;
  updateActivity: (id: string, patch: Partial<Activity>) => void;
  removeActivity: (id: string) => void;
  toggleActivityActive: (id: string) => void;
  setActivities: (activities: Activity[]) => void;
}

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      currentActivityId: null,
      activities: [],
      sidebarOpen: true,
      sidebarCollapsed: false,

      // ── Lifecycle ──────────────────────────
      setCurrentUser: (user) => set({ currentUser: user }),
      setCurrentActivity: (id) => set({ currentActivityId: id }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // ── Activity CRUD ─────────────────────
      addActivity: (input) => {
        const activity: Activity = "id" in input && input.id
          ? (input as Activity)
          : {
              ...(input as Omit<Activity, "id" | "userId" | "createdAt" | "updatedAt" | "isActive">),
              id: generateId(),
              userId: get().currentUser?.id ?? "local",
              isActive: true,
              createdAt: now(),
              updatedAt: now(),
            };
        set((state) => ({
          activities: [activity, ...state.activities.filter((a) => a.id !== activity.id)],
        }));
        return activity;
      },

      updateActivity: (id, patch) => {
        set((state) => ({
          activities: state.activities.map((a) =>
            a.id === id ? { ...a, ...patch, updatedAt: now() } : a
          ),
        }));
      },

      removeActivity: (id) => {
        set((state) => ({
          activities: state.activities.filter((a) => a.id !== id),
          // Clear selection if deleted
          currentActivityId:
            state.currentActivityId === id ? null : state.currentActivityId,
        }));
      },

      toggleActivityActive: (id) => {
        set((state) => ({
          activities: state.activities.map((a) =>
            a.id === id ? { ...a, isActive: !a.isActive, updatedAt: now() } : a
          ),
        }));
      },

      setActivities: (activities) => set({ activities }),
    }),
    {
      name: "ecopro-app-v3",
      // Persist activities + UI state (skip currentUser — set on auth)
      partialize: (state) => ({
        activities: state.activities,
        currentActivityId: state.currentActivityId,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
      // Merge: se il localStorage è vuoto (primo avvio), usa i mock
      merge: (persistedState: unknown, current: AppState): AppState => {
        const p = persistedState as Partial<AppState>;
        return { ...current, ...p };
      },
    }
  )
);

// ─────────────────────────────────────────────
// Selectors
// ─────────────────────────────────────────────

export const selectActivities = (s: AppState) => s.activities;
export const selectActiveActivities = (s: AppState) =>
  s.activities.filter((a) => a.isActive);
export const selectActivityById = (id: string) => (s: AppState) =>
  s.activities.find((a) => a.id === id);
