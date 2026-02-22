"use client";

import { useState, useCallback, useTransition } from "react";
import toast from "react-hot-toast";
import type { ActionResult } from "@/actions/types";

/**
 * Generic CRUD state manager with optimistic updates.
 * T = entity type (Project, Task, etc.)
 */
export function useCrud<T extends { id: string }>(initialItems: T[] = []) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [isPending, startTransition] = useTransition();

  // ── Create ──────────────────────────────────
  const handleCreate = useCallback(
    async (
      action: () => Promise<ActionResult<T>>,
      successMsg = "Creato con successo"
    ) => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.error);
        return null;
      }
      setItems((prev) => [result.data, ...prev]);
      toast.success(successMsg);
      return result.data;
    },
    []
  );

  // ── Update ──────────────────────────────────
  const handleUpdate = useCallback(
    async (
      action: () => Promise<ActionResult<T>>,
      successMsg = "Aggiornato"
    ) => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.error);
        return null;
      }
      setItems((prev) =>
        prev.map((item) => (item.id === result.data.id ? result.data : item))
      );
      toast.success(successMsg);
      return result.data;
    },
    []
  );

  // ── Delete ──────────────────────────────────
  const handleDelete = useCallback(
    async (
      id: string,
      action: () => Promise<ActionResult<void>>,
      successMsg = "Eliminato"
    ) => {
      // Optimistic remove
      setItems((prev) => prev.filter((item) => item.id !== id));
      const result = await action();
      if (!result.ok) {
        toast.error(result.error);
        // Re-fetch would be needed here; for now just notify
        return false;
      }
      toast.success(successMsg);
      return true;
    },
    []
  );

  // ── Sync from server ─────────────────────────
  const syncItems = useCallback((newItems: T[]) => {
    setItems(newItems);
  }, []);

  return {
    items,
    isPending,
    handleCreate,
    handleUpdate,
    handleDelete,
    syncItems,
    setItems,
  };
}

/**
 * Delete confirmation state helper.
 */
export function useDeleteConfirm<T extends { id: string; name: string }>() {
  const [toDelete, setToDelete] = useState<T | null>(null);

  return {
    toDelete,
    requestDelete: (item: T) => setToDelete(item),
    cancelDelete: () => setToDelete(null),
    confirmDelete: () => {
      const item = toDelete;
      setToDelete(null);
      return item;
    },
  };
}
