"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Activity, BusinessModel, LifecycleStage } from "@/types";
import { useAppStore } from "@/store/app.store";
import { createActivity, updateActivity } from "@/actions/activities";

// ─────────────────────────────────────────────
// Static options
// ─────────────────────────────────────────────

const LIFECYCLE_OPTIONS: { value: LifecycleStage; label: string }[] = [
  { value: "idea", label: "💡 Idea" },
  { value: "validation", label: "🔬 Validation" },
  { value: "early_stage", label: "🌱 Early Stage" },
  { value: "growth", label: "📈 Growth" },
  { value: "scale", label: "🚀 Scale" },
  { value: "mature", label: "🏛️ Mature" },
  { value: "exit", label: "🏁 Exit" },
];

const BUSINESS_MODEL_OPTIONS: { value: BusinessModel; label: string }[] = [
  { value: "b2b", label: "B2B" },
  { value: "b2c", label: "B2C" },
  { value: "b2b2c", label: "B2B2C" },
  { value: "marketplace", label: "Marketplace" },
  { value: "saas", label: "SaaS" },
  { value: "consulting", label: "Consulting" },
  { value: "product", label: "Product" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "franchise", label: "Franchise" },
  { value: "licensing", label: "Licensing" },
];

const COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#ec4899",
  "#f43f5e", "#f97316", "#f59e0b", "#84cc16",
  "#10b981", "#06b6d4", "#3b82f6", "#64748b",
];

const SECTORS = [
  "Technology / Software",
  "Design / Branding",
  "Consulting / Training",
  "Fashion / Luxury",
  "SaaS / FinTech",
  "E-commerce",
  "Healthcare",
  "Real Estate",
  "Food & Beverage",
  "Manufacturing",
  "Media / Content",
  "Education",
  "Altro",
];

// ─────────────────────────────────────────────
// Form state type
// ─────────────────────────────────────────────

interface FormState {
  name: string;
  description: string;
  sector: string;
  sectorCustom: string;
  businessModels: BusinessModel[];
  geography: string;
  lifecycleStage: LifecycleStage;
  capitalInvested: string;
  weeklyTimeAllocated: string;
  color: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function defaultState(activity?: Activity): FormState {
  return {
    name: activity?.name ?? "",
    description: activity?.description ?? "",
    sector: activity?.sector ?? "Technology / Software",
    sectorCustom: "",
    businessModels: activity?.businessModels ?? ["b2b"],
    geography: activity?.geography?.join(", ") ?? "",
    lifecycleStage: activity?.lifecycleStage ?? "early_stage",
    capitalInvested: activity?.capitalInvested?.toString() ?? "0",
    weeklyTimeAllocated: activity?.weeklyTimeAllocated?.toString() ?? "10",
    color: activity?.color ?? "#6366f1",
  };
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

interface ActivityFormProps {
  open: boolean;
  onClose: () => void;
  activity?: Activity;
  onSuccess?: (activity: Activity) => void;
}

export function ActivityForm({ open, onClose, activity, onSuccess }: ActivityFormProps) {
  const isEdit = !!activity;
  const { addActivity: addToStore, updateActivity: updateInStore } = useAppStore();

  const [form, setForm] = useState<FormState>(() => defaultState(activity));
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(defaultState(activity));
      setErrors({});
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function toggleBM(bm: BusinessModel) {
    setForm((f) => ({
      ...f,
      businessModels: f.businessModels.includes(bm)
        ? f.businessModels.filter((x) => x !== bm)
        : [...f.businessModels, bm],
    }));
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = "Nome obbligatorio";
    if (form.businessModels.length === 0)
      errs.businessModels = "Seleziona almeno un modello";
    if (Number(form.capitalInvested) < 0)
      errs.capitalInvested = "Importo non valido";
    if (Number(form.weeklyTimeAllocated) < 0)
      errs.weeklyTimeAllocated = "Ore non valide";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      sector: form.sector === "Altro" ? form.sectorCustom.trim() || "Altro" : form.sector,
      businessModels: form.businessModels,
      geography: form.geography
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean),
      lifecycleStage: form.lifecycleStage,
      capitalInvested: Math.max(0, Number(form.capitalInvested) || 0),
      weeklyTimeAllocated: Math.max(0, Number(form.weeklyTimeAllocated) || 0),
      color: form.color,
    };

    try {
      if (isEdit && activity) {
        const result = await updateActivity({ id: activity.id, ...payload });
        if (result.ok) {
          updateInStore(activity.id, result.data);
          toast.success("Activity aggiornata");
          onSuccess?.(result.data);
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await createActivity(payload);
        if (result.ok) {
          addToStore(result.data);
          toast.success(`"${result.data.name}" creata!`);
          onSuccess?.(result.data);
        } else {
          toast.error(result.error);
        }
      }
    } catch (err) {
      toast.error("Errore imprevisto");
      console.error(err);
    }

    setLoading(false);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Modifica ${activity?.name}` : "Nuova Activity"}
      description={
        isEdit
          ? "Modifica le proprietà dell'activity"
          : "Aggiungi una nuova area di attività al tuo portfolio"
      }
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Annulla
          </Button>
          <Button
            loading={loading}
            onClick={handleSubmit as unknown as React.MouseEventHandler}
          >
            {isEdit ? "Salva modifiche" : "Crea Activity"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5 py-2">
        {/* Name + Color */}
        <div className="flex gap-3 items-end">
          <Input
            label="Nome Activity *"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="es. OWLTECH"
            error={errors.name}
            className="flex-1"
          />
          <div className="flex flex-col gap-1.5 shrink-0">
            <label className="text-xs font-medium text-foreground/80">Colore</label>
            <div className="flex flex-wrap gap-1.5 w-36">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("color", c)}
                  className={cn(
                    "h-6 w-6 rounded-md transition-all",
                    form.color === c &&
                      "ring-2 ring-white ring-offset-2 ring-offset-card scale-110"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <Textarea
          label="Descrizione"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Obiettivo, proposta di valore, contesto..."
          rows={2}
        />

        {/* Sector */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Settore *"
            value={form.sector}
            onChange={(e) => set("sector", e.target.value)}
            options={SECTORS.map((s) => ({ value: s, label: s }))}
          />
          {form.sector === "Altro" && (
            <Input
              label="Settore personalizzato"
              value={form.sectorCustom}
              onChange={(e) => set("sectorCustom", e.target.value)}
              placeholder="es. AgriTech"
            />
          )}
        </div>

        {/* Business Models */}
        <div>
          <label className="text-xs font-medium text-foreground/80 block mb-2">
            Business Model *
            {errors.businessModels && (
              <span className="ml-2 text-destructive text-xs">{errors.businessModels}</span>
            )}
          </label>
          <div className="flex flex-wrap gap-2">
            {BUSINESS_MODEL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleBM(opt.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                  form.businessModels.includes(opt.value)
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Geography */}
        <Input
          label="Aree geografiche"
          value={form.geography}
          onChange={(e) => set("geography", e.target.value)}
          placeholder="es. Italia, Europa, USA"
          hint="Separare i mercati con virgola"
        />

        {/* Lifecycle + Capital + Hours */}
        <div className="grid grid-cols-3 gap-3">
          <Select
            label="Lifecycle Stage"
            value={form.lifecycleStage}
            onChange={(e) =>
              set("lifecycleStage", e.target.value as LifecycleStage)
            }
            options={LIFECYCLE_OPTIONS}
          />
          <Input
            label="Capitale investito (€)"
            type="number"
            min="0"
            step="100"
            value={form.capitalInvested}
            onChange={(e) => set("capitalInvested", e.target.value)}
            error={errors.capitalInvested}
          />
          <Input
            label="Ore/settimana dedicate"
            type="number"
            min="0"
            max="168"
            step="1"
            value={form.weeklyTimeAllocated}
            onChange={(e) => set("weeklyTimeAllocated", e.target.value)}
            error={errors.weeklyTimeAllocated}
          />
        </div>

        {/* Preview */}
        <div
          className="rounded-xl p-4 border"
          style={{
            borderColor: `${form.color}30`,
            background: `${form.color}08`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
              style={{
                backgroundColor: `${form.color}25`,
                color: form.color,
              }}
            >
              {form.name.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">
                {form.name || "Nome activity"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {form.lifecycleStage} ·{" "}
                {form.businessModels.join(", ") || "nessun modello"} ·{" "}
                {form.weeklyTimeAllocated || "0"}h/sett.
              </p>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
