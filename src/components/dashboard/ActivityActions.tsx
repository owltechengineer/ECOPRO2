"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Pencil, Trash2, Power } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActivityForm } from "@/components/forms/ActivityForm";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAppStore } from "@/store/app.store";
import { deleteActivity, toggleActivityActive as toggleActivityActiveAction } from "@/actions/activities";
import type { Activity } from "@/types";

interface ActivityActionsProps {
  activity: Activity;
  /** Show label next to icons (default: false = icon only) */
  showLabels?: boolean;
  className?: string;
}

export function ActivityActions({
  activity,
  showLabels = false,
  className,
}: ActivityActionsProps) {
  const router = useRouter();
  const { removeActivity, toggleActivityActive } = useAppStore();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleDelete() {
    const result = await deleteActivity(activity.id);
    if (!result.ok) { toast.error(result.error); return; }
    removeActivity(activity.id);
    toast.success(`"${activity.name}" eliminata`);
    setDeleteOpen(false);
    router.push("/dashboard");
  }

  async function handleToggle() {
    const next = !activity.isActive;
    const result = await toggleActivityActiveAction(activity.id, next);
    if (!result.ok) { toast.error(result.error); return; }
    toggleActivityActive(activity.id);
    toast.success(next ? `${activity.name} riattivata` : `${activity.name} disattivata`);
  }

  return (
    <>
      <div className={cn("flex items-center gap-1", className)}>
        {/* Toggle active */}
        <button
          onClick={handleToggle}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
            activity.isActive
              ? "text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10"
              : "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15"
          )}
          title={activity.isActive ? "Disattiva activity" : "Attiva activity"}
        >
          <Power className="h-3.5 w-3.5 shrink-0" />
          {showLabels && (
            <span className="hidden sm:inline">{activity.isActive ? "Disattiva" : "Attiva"}</span>
          )}
        </button>

        {/* Edit */}
        <button
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Modifica activity"
        >
          <Pencil className="h-3.5 w-3.5 shrink-0" />
          {showLabels && <span className="hidden sm:inline">Modifica</span>}
        </button>

        {/* Delete */}
        <button
          onClick={() => setDeleteOpen(true)}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Elimina activity"
        >
          <Trash2 className="h-3.5 w-3.5 shrink-0" />
          {showLabels && <span className="hidden sm:inline">Elimina</span>}
        </button>
      </div>

      <ActivityForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        activity={activity}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title={`Elimina ${activity.name}`}
        description={`Stai per eliminare l'activity "${activity.name}" con tutti i suoi dati. Verrai reindirizzato alla dashboard globale. Questa azione è irreversibile.`}
        confirmLabel="Elimina definitivamente"
      />
    </>
  );
}
