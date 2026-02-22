"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ActivityForm } from "@/components/forms/ActivityForm";
import { useAppStore } from "@/store/app.store";
import { cn, formatCurrency } from "@/lib/utils";
import type { Activity } from "@/types";
import {
  Activity as ActivityIcon,
  Bell,
  Globe,
  Shield,
  Plus,
  Pencil,
  Trash2,
  Power,
} from "lucide-react";

const CURRENCIES = ["EUR", "USD", "GBP", "CHF"];

export default function SettingsPage() {
  const { activities, removeActivity, toggleActivityActive } = useAppStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);

  function handleDelete() {
    if (!deleteTarget) return;
    removeActivity(deleteTarget.id);
    toast.success(`"${deleteTarget.name}" eliminata`);
    setDeleteTarget(null);
  }

  function handleToggle(activity: Activity) {
    toggleActivityActive(activity.id);
    toast.success(activity.isActive ? `${activity.name} disattivata` : `${activity.name} attivata`);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-bold">Impostazioni</h2>
        <p className="text-sm text-muted-foreground">
          Gestisci le tue activities, preferenze globali e integrazioni
        </p>
      </div>

      {/* ── Activities Management ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="h-4 w-4 text-primary" />
            Activities ({activities.length})
          </CardTitle>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Nuova Activity
          </Button>
        </CardHeader>

        <div className="space-y-2">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className={cn(
                "flex items-center gap-4 p-3.5 rounded-xl border transition-colors",
                activity.isActive
                  ? "border-border/50 bg-card hover:bg-accent/10"
                  : "border-border/30 bg-secondary/20 opacity-60"
              )}
            >
              {/* Icon */}
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl font-black text-sm shrink-0"
                style={{
                  backgroundColor: `${activity.color}20`,
                  color: activity.color,
                  border: `1px solid ${activity.color}30`,
                }}
              >
                {activity.name.charAt(0)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="text-sm font-bold truncate">{activity.name}</p>
                  <Badge variant={activity.isActive ? "success" : "neutral"} size="sm">
                    {activity.isActive ? "Attiva" : "Inattiva"}
                  </Badge>
                  <Badge variant="neutral" size="sm">{activity.lifecycleStage}</Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {activity.sector} ·{" "}
                  {activity.businessModels.slice(0, 3).join(", ").toUpperCase()} ·{" "}
                  {activity.weeklyTimeAllocated}h/sett. ·{" "}
                  {formatCurrency(activity.capitalInvested, "EUR", true)} investiti
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleToggle(activity)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                    activity.isActive
                      ? "text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10"
                      : "text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10"
                  )}
                  title={activity.isActive ? "Disattiva" : "Attiva"}
                >
                  <Power className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={() => setEditActivity(activity)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  title="Modifica"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={() => setDeleteTarget(activity)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Elimina"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {activities.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Nessuna activity ancora. Inizia creando la prima.
              </p>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Crea la prima Activity
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* ── Global Settings ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Impostazioni Globali
          </CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-foreground/80 block mb-2">
              Valuta predefinita
            </label>
            <div className="flex gap-2 flex-wrap">
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                    c === "EUR"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground/80 block mb-2">
              Fuso orario
            </label>
            <div className="flex gap-2">
              {["Rome", "Zurich", "London"].map((tz) => (
                <button
                  key={tz}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                    tz === "Rome"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  {tz}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ── KPI Thresholds ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="h-4 w-4 text-primary" />
            Soglie KPI — Alert Automatici
          </CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "ROI Warning", value: "< 5%", desc: "Sotto questa soglia scatta alert" },
            { label: "Margine Warning", value: "< 10%", desc: "Margine minimo accettabile" },
            { label: "Runway Critico", value: "< 3 mesi", desc: "Mesi di cassa prima di alert critico" },
            { label: "Budget Overrun", value: "> 15%", desc: "Sforamento che triggera warning" },
          ].map((t) => (
            <div
              key={t.label}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/30"
            >
              <div>
                <p className="text-xs font-semibold">{t.label}</p>
                <p className="text-[10px] text-muted-foreground">{t.desc}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-primary">{t.value}</span>
                <Button size="sm" variant="ghost">
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Notifications ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Notifiche
          </CardTitle>
        </CardHeader>
        <div className="space-y-2">
          {[
            { label: "Email digest settimanale", enabled: true },
            { label: "Alert task in ritardo", enabled: true },
            { label: "Alert sforamento budget", enabled: true },
            { label: "Alert burn rate critico", enabled: true },
            { label: "Milestone raggiunte", enabled: true },
            { label: "Push notifications", enabled: false },
          ].map((n) => (
            <div
              key={n.label}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/20"
            >
              <p className="text-sm">{n.label}</p>
              <div
                className={cn(
                  "flex h-6 w-11 items-center rounded-full cursor-pointer px-0.5 transition-colors",
                  n.enabled ? "bg-primary justify-end" : "bg-secondary justify-start"
                )}
              >
                <div className="h-5 w-5 rounded-full bg-white shadow-sm" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Integrations ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Integrazioni
          </CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-sm font-semibold">Supabase</p>
              <Badge variant="success" size="sm">Connesso</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              PostgreSQL · Auth · RLS · Storage
            </p>
            <p className="text-[10px] font-mono text-muted-foreground break-all">
              {process.env.NEXT_PUBLIC_SUPABASE_URL ?? "⚠ NEXT_PUBLIC_SUPABASE_URL non configurato"}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <p className="text-sm font-semibold">OpenAI</p>
              <Badge variant="warning" size="sm">Da configurare</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Necessario per AI Reports e suggerimenti strategici
            </p>
            <Button size="sm" variant="outline">
              Configura API Key
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Modals ── */}
      <ActivityForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <ActivityForm
        open={!!editActivity}
        onClose={() => setEditActivity(null)}
        activity={editActivity ?? undefined}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Elimina ${deleteTarget?.name}`}
        description={`Stai per eliminare l'activity "${deleteTarget?.name}" con tutti i suoi dati. Questa azione è irreversibile.`}
        confirmLabel="Elimina definitivamente"
      />
    </div>
  );
}
