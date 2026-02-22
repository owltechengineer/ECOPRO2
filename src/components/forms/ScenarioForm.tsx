"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { ForecastScenario, ScenarioType } from "@/types";
import { createScenario, updateScenario } from "@/actions/scenarios";

const TYPE_OPTIONS: { value: ScenarioType; label: string; desc: string }[] = [
  { value: "base", label: "Base", desc: "Crescita organica normale" },
  { value: "optimistic", label: "Ottimistico", desc: "Migliore caso possibile" },
  { value: "pessimistic", label: "Pessimistico", desc: "Caso conservativo" },
  { value: "custom", label: "Custom", desc: "Scenario personalizzato" },
];

interface FormState {
  name: string;
  type: ScenarioType;
  description: string;
  revenueGrowthRate: string;
  costInflationRate: string;
  newCustomersPerMonth: string;
  averageOrderValue: string;
  churnRate: string;
  marketingSpend: string;
}

function defaultState(scenario?: ForecastScenario): FormState {
  return {
    name: scenario?.name ?? "",
    type: scenario?.type ?? "base",
    description: scenario?.description ?? "",
    revenueGrowthRate: scenario?.assumptions?.revenueGrowthRate?.toString() ?? "5",
    costInflationRate: scenario?.assumptions?.costInflationRate?.toString() ?? "2",
    newCustomersPerMonth: scenario?.assumptions?.newCustomersPerMonth?.toString() ?? "3",
    averageOrderValue: scenario?.assumptions?.averageOrderValue?.toString() ?? "2500",
    churnRate: scenario?.assumptions?.churnRate?.toString() ?? "2",
    marketingSpend: scenario?.assumptions?.marketingSpend?.toString() ?? "800",
  };
}

interface ScenarioFormProps {
  open: boolean;
  onClose: () => void;
  activityId: string;
  scenario?: ForecastScenario;
  onSuccess?: (scenario: ForecastScenario) => void;
}

export function ScenarioForm({ open, onClose, activityId, scenario, onSuccess }: ScenarioFormProps) {
  const router = useRouter();
  const isEdit = !!scenario;
  const [form, setForm] = useState<FormState>(() => defaultState(scenario));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) errs.name = "Nome obbligatorio";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const assumptions = {
      revenueGrowthRate: Number(form.revenueGrowthRate),
      costInflationRate: Number(form.costInflationRate),
      newCustomersPerMonth: Number(form.newCustomersPerMonth),
      averageOrderValue: Number(form.averageOrderValue),
      churnRate: Number(form.churnRate),
      marketingSpend: Number(form.marketingSpend),
      hiringPlan: scenario?.assumptions?.hiringPlan ?? [],
      capitalEvents: scenario?.assumptions?.capitalEvents ?? [],
    };

    const result = isEdit && scenario
      ? await updateScenario({ id: scenario.id, name: form.name, type: form.type, description: form.description, assumptions })
      : await createScenario({ activityId, name: form.name, type: form.type, description: form.description, assumptions });

    setLoading(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(isEdit ? "Scenario aggiornato" : "Scenario creato!");
    onSuccess?.(result.data);
    onClose();
    router.refresh();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Modifica Scenario" : "Nuovo Scenario Forecast"}
      description="Definisci le assunzioni — le proiezioni vengono calcolate automaticamente"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Annulla</Button>
          <Button loading={loading} onClick={handleSubmit as unknown as React.MouseEventHandler}>
            {isEdit ? "Salva" : "Crea Scenario"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5 py-2">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Nome scenario *"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="es. Crescita organica Q2"
            error={errors.name}
          />
          <Select
            label="Tipo"
            value={form.type}
            onChange={(e) => set("type", e.target.value as ScenarioType)}
            options={TYPE_OPTIONS.map((t) => ({ value: t.value, label: `${t.label} — ${t.desc}` }))}
          />
        </div>

        <Textarea
          label="Descrizione"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Contesto, ipotesi principali, eventi assunti..."
          rows={2}
        />

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-3">Assunzioni Revenue</p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Crescita revenue mensile (%)"
              type="number"
              min="-50"
              max="200"
              step="0.1"
              value={form.revenueGrowthRate}
              onChange={(e) => set("revenueGrowthRate", e.target.value)}
              hint="Es. 5 = +5% al mese sul revenue esistente"
            />
            <Input
              label="Nuovi clienti/mese"
              type="number"
              min="0"
              step="1"
              value={form.newCustomersPerMonth}
              onChange={(e) => set("newCustomersPerMonth", e.target.value)}
            />
            <Input
              label="AOV — Valore medio ordine (€)"
              type="number"
              min="0"
              step="10"
              value={form.averageOrderValue}
              onChange={(e) => set("averageOrderValue", e.target.value)}
            />
            <Input
              label="Churn Rate mensile (%)"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={form.churnRate}
              onChange={(e) => set("churnRate", e.target.value)}
              hint="% clienti che annullano ogni mese"
            />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-3">Assunzioni Costi</p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Inflazione costi mensile (%)"
              type="number"
              min="0"
              max="50"
              step="0.1"
              value={form.costInflationRate}
              onChange={(e) => set("costInflationRate", e.target.value)}
            />
            <Input
              label="Marketing spend mensile (€)"
              type="number"
              min="0"
              step="50"
              value={form.marketingSpend}
              onChange={(e) => set("marketingSpend", e.target.value)}
            />
          </div>
        </div>

        {/* Preview formula */}
        <div className="rounded-lg bg-secondary/30 border border-border/30 p-3 space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Preview formula mese tipo</p>
          <p className="text-xs font-mono text-foreground/80">
            Revenue(t+1) = Revenue(t) × (1 + {form.revenueGrowthRate}%) + {form.newCustomersPerMonth} × €{form.averageOrderValue}
          </p>
          <p className="text-xs font-mono text-foreground/80">
            Costi(t+1) = Costi(t) × (1 + {form.costInflationRate}%/12) + €{form.marketingSpend}
          </p>
          <p className="text-xs font-mono text-foreground/80">
            Clienti(t+1) = Clienti(t) × (1 - {form.churnRate}%) + {form.newCustomersPerMonth}
          </p>
        </div>
      </form>
    </Modal>
  );
}
