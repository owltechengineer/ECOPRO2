"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Activity, Project, ProjectMethodology, ProjectPriority, ProjectStatus } from "@/types";
import { createProject, updateProject } from "@/actions/projects";
import type { CreateProjectInput } from "@/actions/projects";

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "planning", label: "Planning" },
  { value: "in_progress", label: "In Progress" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completato" },
  { value: "cancelled", label: "Cancellato" },
];

const PRIORITY_OPTIONS: { value: ProjectPriority; label: string }[] = [
  { value: "critical", label: "Critico" },
  { value: "high", label: "Alto" },
  { value: "medium", label: "Medio" },
  { value: "low", label: "Basso" },
];

const METHODOLOGY_OPTIONS: { value: ProjectMethodology; label: string }[] = [
  { value: "agile", label: "Agile" },
  { value: "scrum", label: "Scrum" },
  { value: "kanban", label: "Kanban" },
  { value: "waterfall", label: "Waterfall" },
  { value: "lean", label: "Lean" },
  { value: "hybrid", label: "Hybrid" },
];

interface FormState {
  name: string;
  description: string;
  methodology: ProjectMethodology;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: string;
  endDate: string;
  budgetEstimated: string;
  revenueEstimated: string;
  budgetActual: string;
  revenueActual: string;
  completionPct: string;
  tags: string;
}

function defaultState(project?: Project, activity?: Activity | null): FormState {
  const today = new Date().toISOString().split("T")[0];
  const inThreeMonths = new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0];

  // Pre-fill from activity when creating new project (no existing project)
  const defaultBudget =
    !project && activity?.capitalInvested
      ? Math.round(activity.capitalInvested * 0.1).toString()
      : "0";

  return {
    name: project?.name ?? "",
    description: project?.description ?? "",
    methodology: project?.methodology ?? "agile",
    status: project?.status ?? "planning",
    priority: project?.priority ?? "medium",
    startDate: project?.startDate ?? today,
    endDate: project?.endDate ?? inThreeMonths,
    budgetEstimated: project?.budgetEstimated?.toString() ?? defaultBudget,
    revenueEstimated: project?.revenueEstimated?.toString() ?? defaultBudget,
    budgetActual: project?.budgetActual?.toString() ?? "0",
    revenueActual: project?.revenueActual?.toString() ?? "0",
    completionPct: project?.completionPct?.toString() ?? "0",
    tags: project?.tags?.join(", ") ?? "",
  };
}

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  activityId: string;
  activity?: Activity | null;
  project?: Project;
  onSuccess?: (project: Project) => void;
}

export function ProjectForm({ open, onClose, activityId, activity, project, onSuccess }: ProjectFormProps) {
  const router = useRouter();
  const isEdit = !!project;
  const [form, setForm] = useState<FormState>(() => defaultState(project, activity));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setForm(defaultState(project, activity));
  }, [open, project, activity]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) errs.name = "Nome obbligatorio";
    if (!form.startDate) errs.startDate = "Data inizio obbligatoria";
    if (!form.endDate) errs.endDate = "Data fine obbligatoria";
    if (form.startDate && form.endDate && form.startDate > form.endDate)
      errs.endDate = "La data fine deve essere dopo la data inizio";
    if (Number(form.completionPct) < 0 || Number(form.completionPct) > 100)
      errs.completionPct = "Valore tra 0 e 100";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activityId?.trim()) {
      toast.error("Activity non valida. Ricarica la pagina.");
      return;
    }
    if (!validate()) return;
    setLoading(true);

    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);

    const result = isEdit && project
      ? await updateProject({
          id: project.id,
          name: form.name,
          description: form.description || undefined,
          methodology: form.methodology,
          status: form.status,
          priority: form.priority,
          startDate: form.startDate,
          endDate: form.endDate,
          budgetEstimated: Number(form.budgetEstimated),
          budgetActual: Number(form.budgetActual),
          revenueEstimated: Number(form.revenueEstimated),
          revenueActual: Number(form.revenueActual),
          completionPct: Number(form.completionPct),
          tags,
        })
      : await createProject({
          activityId,
          name: form.name,
          description: form.description || undefined,
          methodology: form.methodology,
          status: form.status,
          priority: form.priority,
          startDate: form.startDate,
          endDate: form.endDate,
          budgetEstimated: Number(form.budgetEstimated),
          revenueEstimated: Number(form.revenueEstimated),
          tags,
        });

    setLoading(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(isEdit ? "Progetto aggiornato" : "Progetto creato!");
    onSuccess?.(result.data);
    onClose();
    router.refresh();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Modifica progetto` : "Nuovo Progetto"}
      description={
        isEdit
          ? project?.name
          : activity
            ? `Aggiungi un nuovo progetto a ${activity.name}`
            : "Aggiungi un nuovo progetto a questa attività"
      }
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Annulla</Button>
          <Button loading={loading} onClick={handleSubmit as unknown as React.MouseEventHandler}>
            {isEdit ? "Salva" : "Crea Progetto"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <Input
          label="Nome progetto *"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="es. Lancio Piattaforma SaaS v2"
          error={errors.name}
        />

        <Textarea
          label="Descrizione"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Obiettivo, deliverable, contesto..."
          rows={2}
        />

        <div className="grid grid-cols-3 gap-3">
          <Select
            label="Metodologia"
            value={form.methodology}
            onChange={(e) => set("methodology", e.target.value as ProjectMethodology)}
            options={METHODOLOGY_OPTIONS}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => set("status", e.target.value as ProjectStatus)}
            options={STATUS_OPTIONS}
          />
          <Select
            label="Priorità"
            value={form.priority}
            onChange={(e) => set("priority", e.target.value as ProjectPriority)}
            options={PRIORITY_OPTIONS}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Data inizio *"
            type="date"
            value={form.startDate}
            onChange={(e) => set("startDate", e.target.value)}
            error={errors.startDate}
          />
          <Input
            label="Data fine *"
            type="date"
            value={form.endDate}
            onChange={(e) => set("endDate", e.target.value)}
            error={errors.endDate}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Budget stimato (€)"
            type="number"
            min="0"
            step="100"
            value={form.budgetEstimated}
            onChange={(e) => set("budgetEstimated", e.target.value)}
          />
          <Input
            label="Revenue stimata (€)"
            type="number"
            min="0"
            step="100"
            value={form.revenueEstimated}
            onChange={(e) => set("revenueEstimated", e.target.value)}
          />
        </div>

        {isEdit && (
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Budget effettivo (€)"
              type="number"
              min="0"
              value={form.budgetActual}
              onChange={(e) => set("budgetActual", e.target.value)}
            />
            <Input
              label="Revenue effettiva (€)"
              type="number"
              min="0"
              value={form.revenueActual}
              onChange={(e) => set("revenueActual", e.target.value)}
            />
            <Input
              label="Avanzamento (%)"
              type="number"
              min="0"
              max="100"
              value={form.completionPct}
              onChange={(e) => set("completionPct", e.target.value)}
              error={errors.completionPct}
            />
          </div>
        )}

        <Input
          label="Tag"
          value={form.tags}
          onChange={(e) => set("tags", e.target.value)}
          placeholder="es. saas, mvp, marketing (separati da virgola)"
        />
      </form>
    </Modal>
  );
}
