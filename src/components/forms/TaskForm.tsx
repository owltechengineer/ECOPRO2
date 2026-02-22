"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Task, TaskStatus, ProjectPriority, Project } from "@/types";
import { createTask, updateTask } from "@/actions/tasks";

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "Da fare" },
  { value: "in_progress", label: "In corso" },
  { value: "review", label: "In revisione" },
  { value: "done", label: "Completato" },
  { value: "blocked", label: "Bloccato" },
];

const PRIORITY_OPTIONS: { value: ProjectPriority; label: string }[] = [
  { value: "critical", label: "Critico" },
  { value: "high", label: "Alto" },
  { value: "medium", label: "Medio" },
  { value: "low", label: "Basso" },
];

interface FormState {
  name: string;
  description: string;
  projectId: string;
  status: TaskStatus;
  priority: ProjectPriority;
  owner: string;
  estimatedHours: string;
  actualHours: string;
  startDate: string;
  deadline: string;
  completionPct: string;
  tags: string;
}

function defaultState(task?: Task, defaultProjectId?: string): FormState {
  const today = new Date().toISOString().split("T")[0];
  const inTwoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];
  return {
    name: task?.name ?? "",
    description: task?.description ?? "",
    projectId: task?.projectId ?? defaultProjectId ?? "",
    status: task?.status ?? "todo",
    priority: task?.priority ?? "medium",
    owner: task?.owner ?? "",
    estimatedHours: task?.estimatedHours?.toString() ?? "4",
    actualHours: task?.actualHours?.toString() ?? "0",
    startDate: task?.startDate ?? today,
    deadline: task?.deadline ?? inTwoWeeks,
    completionPct: task?.completionPct?.toString() ?? "0",
    tags: task?.tags?.join(", ") ?? "",
  };
}

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  activityId: string;
  projects: Project[];
  task?: Task;
  defaultProjectId?: string;
  onSuccess?: (task: Task) => void;
}

export function TaskForm({
  open,
  onClose,
  activityId,
  projects,
  task,
  defaultProjectId,
  onSuccess,
}: TaskFormProps) {
  const router = useRouter();
  const isEdit = !!task;
  const [form, setForm] = useState<FormState>(() => defaultState(task, defaultProjectId));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) errs.name = "Nome obbligatorio";
    if (!form.projectId) errs.projectId = "Seleziona un progetto";
    if (!form.deadline) errs.deadline = "Deadline obbligatoria";
    if (Number(form.estimatedHours) < 0) errs.estimatedHours = "Valore non valido";
    if (Number(form.completionPct) < 0 || Number(form.completionPct) > 100)
      errs.completionPct = "Valore tra 0 e 100";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);

    const result = isEdit && task
      ? await updateTask({
          id: task.id,
          name: form.name,
          description: form.description || undefined,
          status: form.status,
          priority: form.priority,
          owner: form.owner || undefined,
          estimatedHours: Number(form.estimatedHours),
          actualHours: Number(form.actualHours),
          startDate: form.startDate || undefined,
          deadline: form.deadline,
          completionPct: Number(form.completionPct),
          tags,
        })
      : await createTask({
          activityId,
          projectId: form.projectId,
          name: form.name,
          description: form.description || undefined,
          status: form.status,
          priority: form.priority,
          owner: form.owner || undefined,
          estimatedHours: Number(form.estimatedHours),
          startDate: form.startDate || undefined,
          deadline: form.deadline,
          tags,
        });

    setLoading(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(isEdit ? "Task aggiornato" : "Task creato!");
    onSuccess?.(result.data);
    onClose();
    router.refresh();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Modifica Task" : "Nuovo Task"}
      description={isEdit ? task?.name : "Aggiungi un task a un progetto"}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Annulla</Button>
          <Button loading={loading} onClick={handleSubmit as unknown as React.MouseEventHandler}>
            {isEdit ? "Salva" : "Crea Task"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <Input
          label="Nome task *"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="es. Implementare autenticazione JWT"
          error={errors.name}
        />

        <Select
          label="Progetto *"
          value={form.projectId}
          onChange={(e) => set("projectId", e.target.value)}
          error={errors.projectId}
          options={[
            { value: "", label: "Seleziona progetto..." },
            ...projects.map((p) => ({ value: p.id, label: p.name })),
          ]}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => set("status", e.target.value as TaskStatus)}
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
            label="Deadline *"
            type="date"
            value={form.deadline}
            onChange={(e) => set("deadline", e.target.value)}
            error={errors.deadline}
          />
          <Input
            label="Owner / Responsabile"
            value={form.owner}
            onChange={(e) => set("owner", e.target.value)}
            placeholder="es. Fabiano"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Ore stimate"
            type="number"
            min="0"
            step="0.5"
            value={form.estimatedHours}
            onChange={(e) => set("estimatedHours", e.target.value)}
            error={errors.estimatedHours}
          />
          {isEdit && (
            <>
              <Input
                label="Ore effettive"
                type="number"
                min="0"
                step="0.5"
                value={form.actualHours}
                onChange={(e) => set("actualHours", e.target.value)}
              />
              <Input
                label="Avanzamento %"
                type="number"
                min="0"
                max="100"
                value={form.completionPct}
                onChange={(e) => set("completionPct", e.target.value)}
                error={errors.completionPct}
              />
            </>
          )}
        </div>

        <Textarea
          label="Descrizione / Note"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Dettagli, dipendenze, criteri di accettazione..."
          rows={2}
        />

        <Input
          label="Tag"
          value={form.tags}
          onChange={(e) => set("tags", e.target.value)}
          placeholder="es. backend, auth, priority (separati da virgola)"
        />
      </form>
    </Modal>
  );
}
