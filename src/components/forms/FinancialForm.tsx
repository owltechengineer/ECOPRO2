"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FinancialRecord, FinancialRecordType, FinancialCategory, FinancialReminderType, Project } from "@/types";
import { createFinancialRecord, updateFinancialRecord } from "@/actions/financial";

const TYPE_OPTIONS: { value: FinancialRecordType; label: string; color: string }[] = [
  { value: "revenue", label: "Entrata", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  { value: "direct_cost", label: "Costo Diretto", color: "text-red-400 bg-red-500/10 border-red-500/30" },
  { value: "indirect_cost", label: "Costo Indiretto", color: "text-orange-400 bg-orange-500/10 border-orange-500/30" },
  { value: "investment", label: "Investimento", color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  { value: "tax", label: "Tassa / Tributo", color: "text-slate-400 bg-slate-500/10 border-slate-500/30" },
  { value: "financing", label: "Finanziamento", color: "text-violet-400 bg-violet-500/10 border-violet-500/30" },
];

const CATEGORY_OPTIONS: { value: FinancialCategory; label: string }[] = [
  { value: "sales", label: "Vendite" },
  { value: "services", label: "Servizi" },
  { value: "subscriptions", label: "Abbonamenti/SaaS" },
  { value: "advertising", label: "Advertising" },
  { value: "personnel", label: "Personale" },
  { value: "operations", label: "Operations" },
  { value: "marketing", label: "Marketing" },
  { value: "technology", label: "Tecnologia/Tools" },
  { value: "legal", label: "Legale/Consulenza" },
  { value: "rent", label: "Affitti" },
  { value: "equipment", label: "Attrezzature" },
  { value: "other", label: "Altro" },
];

const CURRENCY_OPTIONS = ["EUR", "USD", "GBP", "CHF"].map((c) => ({ value: c, label: c }));

const REMINDER_TYPE_OPTIONS: { value: FinancialReminderType; label: string }[] = [
  { value: "person_to_pay", label: "Persona da pagare" },
  { value: "thing_to_buy", label: "Acquisto da fare (es. stampante)" },
  { value: "payment_due", label: "Scadenza pagamento" },
  { value: "other", label: "Altro" },
];

interface FormState {
  type: FinancialRecordType;
  category: FinancialCategory;
  description: string;
  amount: string;
  currency: string;
  date: string;
  projectId: string;
  isRecurring: boolean;
  recurringInterval: "monthly" | "quarterly" | "annual" | "";
  invoiceRef: string;
  tags: string;
  isReminder: boolean;
  reminderType: FinancialReminderType;
  reminderDueDate: string;
}

function defaultState(record?: FinancialRecord): FormState {
  return {
    type: record?.type ?? "revenue",
    category: record?.category ?? "services",
    description: record?.description ?? "",
    amount: record?.amount?.toString() ?? "",
    currency: record?.currency ?? "EUR",
    date: record?.date ?? new Date().toISOString().split("T")[0],
    projectId: record?.projectId ?? "",
    isRecurring: record?.isRecurring ?? false,
    recurringInterval: record?.recurringInterval ?? "",
    invoiceRef: record?.invoiceRef ?? "",
    tags: record?.tags?.join(", ") ?? "",
    isReminder: record?.isReminder ?? false,
    reminderType: record?.reminderType ?? "other",
    reminderDueDate: record?.reminderDueDate ?? record?.date ?? new Date().toISOString().split("T")[0],
  };
}

interface FinancialFormProps {
  open: boolean;
  onClose: () => void;
  activityId: string;
  projects?: Project[];
  record?: FinancialRecord;
  onSuccess?: (record: FinancialRecord) => void;
}

export function FinancialForm({ open, onClose, activityId, projects = [], record, onSuccess }: FinancialFormProps) {
  const router = useRouter();
  const isEdit = !!record;
  const [form, setForm] = useState<FormState>(() => defaultState(record));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setForm(defaultState(record));
  }, [open, record]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.description.trim()) errs.description = "Descrizione obbligatoria";
    if (!form.amount || Number(form.amount) <= 0) errs.amount = "Importo deve essere > 0";
    if (!form.date) errs.date = "Data obbligatoria";
    if (form.isRecurring && !form.recurringInterval) errs.recurringInterval = "Seleziona intervallo";
    if (form.isReminder && !form.reminderType) errs.reminderType = "Seleziona tipo promemoria";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const payload = {
      activityId,
      type: form.type,
      category: form.category,
      description: form.description.trim(),
      amount: Number(form.amount),
      currency: form.currency,
      date: form.date,
      projectId: form.projectId || undefined,
      isRecurring: form.isRecurring,
      recurringInterval: form.isRecurring && form.recurringInterval
        ? (form.recurringInterval as "monthly" | "quarterly" | "annual")
        : undefined,
      invoiceRef: form.invoiceRef || undefined,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      isReminder: form.isReminder,
      reminderType: form.isReminder ? form.reminderType : undefined,
      reminderDueDate: form.isReminder && form.reminderDueDate ? form.reminderDueDate : undefined,
    };

    const result = isEdit && record
      ? await updateFinancialRecord({ id: record.id, ...payload })
      : await createFinancialRecord(payload);

    setLoading(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(isEdit ? "Registrazione aggiornata" : "Registrazione aggiunta!");
    onSuccess?.(result.data);
    onClose();
    router.refresh();
  }

  const selectedType = TYPE_OPTIONS.find((t) => t.value === form.type);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Modifica Registrazione" : "Nuova Registrazione Finanziaria"}
      description={isEdit ? record?.description : "Aggiungi un'entrata, costo o investimento"}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Annulla</Button>
          <Button loading={loading} onClick={handleSubmit as unknown as React.MouseEventHandler}>
            {isEdit ? "Salva" : "Aggiungi"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        {/* Type selector */}
        <div>
          <label className="text-xs font-medium text-foreground/80 block mb-2">Tipo *</label>
          <div className="grid grid-cols-3 gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set("type", opt.value)}
                className={cn(
                  "px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all text-left",
                  form.type === opt.value
                    ? opt.color
                    : "border-border text-muted-foreground hover:border-border/80"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Descrizione *"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="es. Canone SaaS Cliente Alfa, Stipendio Dev, AWS..."
          error={errors.description}
        />

        <div className="grid grid-cols-3 gap-3">
          <Input
            label={`Importo (${form.currency}) *`}
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            error={errors.amount}
            className="col-span-2"
          />
          <Select
            label="Valuta"
            value={form.currency}
            onChange={(e) => set("currency", e.target.value)}
            options={CURRENCY_OPTIONS}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Data *"
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            error={errors.date}
          />
          <Select
            label="Categoria"
            value={form.category}
            onChange={(e) => set("category", e.target.value as FinancialCategory)}
            options={CATEGORY_OPTIONS}
          />
        </div>

        {projects.length > 0 && (
          <Select
            label="Progetto collegato (opzionale)"
            value={form.projectId}
            onChange={(e) => set("projectId", e.target.value)}
            options={[
              { value: "", label: "Nessun progetto" },
              ...projects.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
        )}

        {/* Ricorrenza */}
        <div className="rounded-lg border border-border/50 p-3 space-y-3">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div
              onClick={() => set("isRecurring", !form.isRecurring)}
              className={cn(
                "flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer px-0.5",
                form.isRecurring ? "bg-primary justify-end" : "bg-secondary justify-start"
              )}
            >
              <div className="h-4 w-4 rounded-full bg-white shadow-sm" />
            </div>
            <span className="text-xs font-medium">Ricorrente</span>
          </label>

          {form.isRecurring && (
            <Select
              label="Frequenza"
              value={form.recurringInterval}
              onChange={(e) => set("recurringInterval", e.target.value as "monthly" | "quarterly" | "annual")}
              error={errors.recurringInterval}
              options={[
                { value: "", label: "Seleziona..." },
                { value: "monthly", label: "Mensile" },
                { value: "quarterly", label: "Trimestrale" },
                { value: "annual", label: "Annuale" },
              ]}
            />
          )}
        </div>

        {/* Promemoria giornaliero */}
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-3">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div
              role="checkbox"
              aria-checked={form.isReminder}
              onClick={() => set("isReminder", !form.isReminder)}
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all",
                form.isReminder
                  ? "bg-amber-500 border-amber-500 text-white"
                  : "border-border bg-background group-hover:border-amber-500/50"
              )}
            >
              {form.isReminder && (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div>
              <span className="text-xs font-semibold text-foreground">Promemoria giornaliero</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Ricevi notifiche ogni giorno finché non completi
              </p>
            </div>
          </label>

          {form.isReminder && (
            <div className="space-y-2 pt-1">
              <Select
                label="Tipo promemoria *"
                value={form.reminderType}
                onChange={(e) => set("reminderType", e.target.value as FinancialReminderType)}
                error={errors.reminderType}
                options={REMINDER_TYPE_OPTIONS}
              />
              <Input
                label="Data scadenza / priorità"
                type="date"
                value={form.reminderDueDate}
                onChange={(e) => set("reminderDueDate", e.target.value)}
                placeholder="Quando ricordare"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Riferimento fattura"
            value={form.invoiceRef}
            onChange={(e) => set("invoiceRef", e.target.value)}
            placeholder="es. FT-2025-001"
          />
          <Input
            label="Tag"
            value={form.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder="es. recurring, saas"
          />
        </div>
      </form>
    </Modal>
  );
}
