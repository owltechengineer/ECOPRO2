"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { AIReport, AIRecommendation } from "@/types";
import { notFound } from "next/navigation";
import toast from "react-hot-toast";
import { useActivity } from "@/hooks/useActivity";
import { ActivityActions } from "@/components/dashboard/ActivityActions";
import { getProjects } from "@/actions/projects";
import { generateAIReport } from "@/actions/ai-reports";
import { TaskForm, type TaskFormInitialValues } from "@/components/forms/TaskForm";
import { Modal } from "@/components/ui/modal";
import { cn, formatDate, getSeverityBg, getSeverityColor } from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Zap,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  Target,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles,
  CheckSquare,
  Search,
} from "lucide-react";
import type { Project } from "@/types";

const AI_PROMPTS = [
  {
    id: "strategic",
    label: "Analisi Strategica",
    prompt: "Analizza la situazione strategica dell'attività, identifica opportunità e rischi principali, e fornisci 3 raccomandazioni prioritarie con impatto stimato.",
    icon: Target,
    color: "#6366f1",
  },
  {
    id: "project",
    label: "Ottimizzazione Progetti",
    prompt: "Analizza i progetti attivi, identifica ritardi e sforamenti, e suggerisci come ottimizzare le risorse e le priorità.",
    icon: Zap,
    color: "#f59e0b",
  },
  {
    id: "market",
    label: "Ricerca di Mercato",
    prompt: "Analizza il mercato di riferimento, identifica trend emergenti, competitor key e suggerisci campagne di marketing efficaci.",
    icon: TrendingUp,
    color: "#10b981",
  },
  {
    id: "finance",
    label: "Forecast Finanziario",
    prompt: "Analizza le tendenze finanziarie, il cash flow e il burn rate. Prevedi il break-even e suggerisci ottimizzazioni dei costi.",
    icon: AlertTriangle,
    color: "#f43f5e",
  },
  {
    id: "opportunities",
    label: "Opportunità & Bandi",
    prompt: "Identifica bandi pubblici, agevolazioni fiscali e opportunità di finanziamento pertinenti al settore e alla fase di sviluppo.",
    icon: Lightbulb,
    color: "#8b5cf6",
  },
];

const EFFORT_COLORS: Record<string, string> = {
  low: "text-emerald-400",
  medium: "text-amber-400",
  high: "text-red-400",
};

const TIMEFRAME_LABELS: Record<string, string> = {
  immediate: "Immediato (< 2 settimane)",
  short_term: "Breve termine (1-3 mesi)",
  medium_term: "Medio termine (3-6 mesi)",
  long_term: "Lungo termine (6+ mesi)",
};

function deadlineFromTimeframe(timeframe: AIRecommendation["timeframe"]): string {
  const d = new Date();
  switch (timeframe) {
    case "immediate": d.setDate(d.getDate() + 14); break;
    case "short_term": d.setMonth(d.getMonth() + 1); break;
    case "medium_term": d.setMonth(d.getMonth() + 3); break;
    case "long_term": d.setMonth(d.getMonth() + 6); break;
    default: d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString().split("T")[0];
}

function recToTaskInitial(rec: AIRecommendation): TaskFormInitialValues {
  const effortHours = rec.effort === "low" ? 4 : rec.effort === "medium" ? 12 : 24;
  return {
    name: rec.title,
    description: rec.description,
    priority: rec.priority,
    estimatedHours: effortHours,
    deadline: deadlineFromTimeframe(rec.timeframe),
  };
}

const PROMPT_INSIGHTS: Record<string, AIReport["insights"]> = {
  strategic: [
    { id: "i1", category: "Revenue", title: "Crescita potenziale", description: "Opportunità di espansione revenue del 15-25% con focus su segmenti high-value.", severity: "success", metric: "Growth", value: 18 },
    { id: "i2", category: "Costi", title: "Ottimizzazione", description: "Riduzione costi indiretti possibile del 10% tramite automazione.", severity: "info", metric: "Savings", value: 10 },
    { id: "i3", category: "Rischi", title: "Burn rate", description: "Monitorare runway e considerare round di finanziamento.", severity: "warning", metric: "Runway", value: 8 },
  ],
  project: [
    { id: "i1", category: "Ritardi", title: "Progetti in sforamento", description: "2-3 progetti oltre la deadline. Priorità su deliverable critici.", severity: "warning", metric: "Overdue", value: 2 },
    { id: "i2", category: "Risorse", title: "Allocazione", description: "Riprioritizzare ore su task ad alto impatto. Ridistribuzione possibile.", severity: "info", metric: "Hours", value: 12 },
    { id: "i3", category: "Parallelizzazione", title: "Task indipendenti", description: "Opportunità di parallelizzare 4+ task non dipendenti.", severity: "success", metric: "Speed", value: 25 },
  ],
  market: [
    { id: "i1", category: "Trend", title: "Crescita settore", description: "Mercato in espansione +12% annuo. Finestra di opportunità aperta.", severity: "success", metric: "Growth", value: 12 },
    { id: "i2", category: "Competitor", title: "Posizionamento", description: "3-5 competitor diretti. Differenziazione su servizio e prezzo.", severity: "info", metric: "Share", value: 15 },
    { id: "i3", category: "Marketing", title: "CAC", description: "Costo acquisizione cliente in linea. Ottimizzare canali organici.", severity: "info", metric: "CAC", value: 85 },
  ],
  finance: [
    { id: "i1", category: "Cash flow", title: "Burn rate", description: "Runway attuale 8-10 mesi. Monitorare uscite ricorrenti.", severity: "warning", metric: "Months", value: 8 },
    { id: "i2", category: "Break-even", title: "Previsione", description: "Break-even stimato in 12-18 mesi con trend attuale.", severity: "info", metric: "Months", value: 15 },
    { id: "i3", category: "Costi", title: "Ottimizzazioni", description: "Potenziale risparmio 10-15% su fornitori e costi indiretti.", severity: "success", metric: "Savings", value: 12 },
  ],
  opportunities: [
    { id: "i1", category: "Bandi", title: "PNRR", description: "Fondi digitalizzazione PMI disponibili. Scadenza trimestrale.", severity: "success", metric: "Funds", value: 1 },
    { id: "i2", category: "Agevolazioni", title: "Credito R&D", description: "Credito d'imposta R&D fino al 20% per attività innovative.", severity: "info", metric: "Rate", value: 20 },
    { id: "i3", category: "Fondi", title: "Regionali", description: "Bandi regionali per startup e innovazione. Verificare requisiti.", severity: "info", metric: "Open", value: 3 },
  ],
};

const PROMPT_RECOMMENDATIONS: Record<string, AIReport["recommendations"]> = {
  strategic: [
    { id: "r1", title: "Definire metriche OKR chiare", description: "Implementare framework OKR per allineare team e priorità. Impatto su produttività stimato +20%.", priority: "high", estimatedImpact: "Alto", effort: "medium", timeframe: "short_term" },
    { id: "r2", title: "Revisione contratti fornitori", description: "Rinegoziare contratti annuali per ridurre costi fissi. Potenziale risparmio 5-15%.", priority: "medium", estimatedImpact: "Medio", effort: "low", timeframe: "immediate" },
    { id: "r3", title: "Accelerare go-to-market", description: "Ridurre time-to-market con focus su MVP e early adopters.", priority: "high", estimatedImpact: "Alto", effort: "high", timeframe: "medium_term" },
  ],
  project: [
    { id: "r1", title: "Riprioritizzare task critici", description: "Identificare i 3 deliverable ad alto impatto e allocare risorse dedicate. Sospendere task a basso valore.", priority: "high", estimatedImpact: "Alto", effort: "low", timeframe: "immediate" },
    { id: "r2", title: "Daily standup sui ritardi", description: "Introduurre check-in giornalieri sui progetti in sforamento. Blocchi e dipendenze visibili.", priority: "medium", estimatedImpact: "Medio", effort: "low", timeframe: "immediate" },
    { id: "r3", title: "Parallelizzare task indipendenti", description: "Mappare dipendenze e avviare in parallelo task non collegati. Riduzione timeline 15-25%.", priority: "high", estimatedImpact: "Alto", effort: "medium", timeframe: "short_term" },
  ],
  market: [
    { id: "r1", title: "Content marketing e SEO", description: "Investire in contenuti settoriali e ottimizzazione SEO. Acquisizione organica a costo ridotto.", priority: "high", estimatedImpact: "Alto", effort: "medium", timeframe: "short_term" },
    { id: "r2", title: "Partnership strategiche", description: "Identificare 2-3 partner complementari per co-marketing e lead sharing.", priority: "medium", estimatedImpact: "Medio", effort: "medium", timeframe: "medium_term" },
    { id: "r3", title: "Analisi competitor trimestrale", description: "Report periodico su prezzi, feature e posizionamento dei competitor chiave.", priority: "medium", estimatedImpact: "Medio", effort: "low", timeframe: "immediate" },
  ],
  finance: [
    { id: "r1", title: "Rinegoziazione fornitori", description: "Rivedere contratti annuali con i 3 fornitori principali. Obiettivo risparmio 8-12%.", priority: "high", estimatedImpact: "Alto", effort: "low", timeframe: "immediate" },
    { id: "r2", title: "Automazione processi amministrativi", description: "Digitalizzare fatture, ordini e reportistica. Riduzione ore manuali 20-30%.", priority: "high", estimatedImpact: "Alto", effort: "medium", timeframe: "short_term" },
    { id: "r3", title: "Dashboard cash flow real-time", description: "Implementare vista consolidata entrate/uscite con alert su soglie critiche.", priority: "medium", estimatedImpact: "Medio", effort: "low", timeframe: "immediate" },
  ],
  opportunities: [
    { id: "r1", title: "Verifica requisiti bandi PNRR", description: "Valutare idoneità per fondi digitalizzazione PMI. Documentazione e tempistiche.", priority: "high", estimatedImpact: "Alto", effort: "medium", timeframe: "short_term" },
    { id: "r2", title: "Credito d'imposta R&D", description: "Mappare attività R&D e spese ammissibili. Potenziale credito 15-20%.", priority: "high", estimatedImpact: "Alto", effort: "low", timeframe: "immediate" },
    { id: "r3", title: "Fondi regionali e acceleratori", description: "Censire bandi aperti e programmi di accelerazione. Applicare ai più pertinenti.", priority: "medium", estimatedImpact: "Medio", effort: "medium", timeframe: "short_term" },
  ],
};

function generateMockReport(activityId: string, activityName: string, promptId: string): AIReport {
  const prompt = AI_PROMPTS.find((p) => p.id === promptId) ?? AI_PROMPTS[0];
  const summaries: Record<string, string> = {
    strategic: `Analisi strategica per ${activityName}: l'attività è nella fase di ${activityName.length % 3 === 0 ? "crescita" : "validazione"}. Principali opportunità: espansione mercato, ottimizzazione costi, partnership strategiche. Rischi: competizione, burn rate. Raccomandazioni prioritarie: focus su metriche chiave, revisione budget, accelerazione go-to-market.`,
    project: `Ottimizzazione progetti per ${activityName}: identificati 2-3 progetti con ritardi. Suggerimenti: riprioritizzare task critici, allocare risorse su deliverable ad alto impatto, considerare parallelizzazione delle attività non dipendenti.`,
    market: `Ricerca mercato per ${activityName}: trend emergenti nel settore. Competitor chiave da monitorare. Campagne marketing suggerite: content marketing, partnership, eventi settoriali.`,
    finance: `Forecast finanziario: analisi cash flow e burn rate. Break-even stimato in 12-18 mesi. Ottimizzazioni costi: rinegoziazione fornitori, automazione processi, riduzione costi indiretti.`,
    opportunities: `Opportunità di finanziamento: bandi PNRR digitalizzazione, agevolazioni startup innovative, fondi regionali. Verificare requisiti per crediti d'imposta R&D.`,
  };
  const insights = PROMPT_INSIGHTS[promptId] ?? PROMPT_INSIGHTS.strategic;
  const recommendations = PROMPT_RECOMMENDATIONS[promptId] ?? PROMPT_RECOMMENDATIONS.strategic;
  return {
    id: `ai-${Date.now()}`,
    activityId,
    type: promptId as AIReport["type"],
    title: `${prompt.label} — ${activityName}`,
    summary: summaries[promptId] ?? summaries.strategic,
    insights: insights.map((i, idx) => ({ ...i, id: `i-${promptId}-${idx}` })),
    recommendations: recommendations.map((r, idx) => ({ ...r, id: `r-${promptId}-${idx}` })),
    generatedAt: new Date().toISOString(),
    dataSnapshot: {},
  };
}

export default function AIPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const { activityId } = use(params);
  const activity = useActivity(activityId);
  if (!activity) return notFound();

  const router = useRouter();
  const [report, setReport] = useState<AIReport | null>(null);
  const [expandedRec, setExpandedRec] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [createTaskFromRec, setCreateTaskFromRec] = useState<AIRecommendation | null>(null);
  const [detailRec, setDetailRec] = useState<AIRecommendation | null>(null);

  useEffect(() => {
    getProjects(activityId).then((r) => { if (r.ok) setProjects(r.data); });
  }, [activityId]);

  const handleGenerate = async (promptId: string) => {
    setSelectedPrompt(promptId);
    setIsGenerating(true);
    setGenerateError(null);
    const promptConfig = AI_PROMPTS.find((p) => p.id === promptId) ?? AI_PROMPTS[0];
    try {
      const result = await generateAIReport(
        {
          name: activity.name,
          sector: activity.sector,
          description: activity.description,
          businessModels: activity.businessModels,
          geography: activity.geography,
          lifecycleStage: activity.lifecycleStage,
        },
        promptId,
        promptConfig.label,
        promptConfig.prompt
      );
      if (result.ok) {
        const reportWithId = { ...result.data, activityId };
        setReport(reportWithId);
        toast.success("Report generato con AI");
      } else {
        const mock = generateMockReport(activityId, activity.name, promptId);
        mock.activityId = activityId;
        setReport(mock);
        toast.success("Report generato (modalità demo — configura GROQ_API_KEY per AI reale)");
        if (result.error?.includes("GROQ")) setGenerateError(result.error);
      }
    } catch (err) {
      const mock = generateMockReport(activityId, activity.name, promptId);
      mock.activityId = activityId;
      setReport(mock);
      const msg = err instanceof Error ? err.message : "Errore durante la generazione";
      setGenerateError(msg);
      toast.error("Fallback a dati demo");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Reports & Intelligence
          </h2>
          <p className="text-sm text-muted-foreground">
            Analisi AI per {activity.name} — powered by LLM
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ActivityActions activity={activity} />
          <Button
            size="sm"
            loading={isGenerating}
            onClick={() => handleGenerate("strategic")}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Genera Report
          </Button>
        </div>
      </div>

      {/* AI Prompt Library */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Prompt AI Preconfigurati
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            Seleziona un modulo di analisi
          </span>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {AI_PROMPTS.map((prompt) => (
            <button
              key={prompt.id}
              onClick={() => handleGenerate(prompt.id)}
              className={cn(
                "flex flex-col gap-2 p-3 rounded-lg border text-left transition-all duration-200",
                "hover:border-primary/40 hover:bg-primary/5",
                selectedPrompt === prompt.id && isGenerating
                  ? "border-primary/50 bg-primary/5 animate-pulse"
                  : "border-border/50 bg-secondary/20"
              )}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${prompt.color}20` }}
              >
                <prompt.icon className="h-4 w-4" style={{ color: prompt.color }} />
              </div>
              <p className="text-xs font-semibold">{prompt.label}</p>
              <p className="text-[10px] text-muted-foreground line-clamp-2">
                {prompt.prompt}
              </p>
            </button>
          ))}
        </div>
      </Card>

      {generateError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {generateError}
        </div>
      )}

      {/* Latest report */}
      {report ? (
        <>
          {/* Report header */}
          <div
            className="rounded-xl border p-5"
            style={{ borderColor: `${activity.color}30`, background: `${activity.color}05` }}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Bot className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold">{report.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Generato il {formatDate(report.generatedAt, "long")}
                </p>
              </div>
              <Button variant="ghost" size="sm">
                <RefreshCw className="h-3.5 w-3.5" />
                Aggiorna
              </Button>
            </div>

            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-foreground/90 leading-relaxed">{report.summary}</p>
            </div>
          </div>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                Insights ({report.insights.length})
              </CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {report.insights.map((insight) => (
                <div
                  key={insight.id}
                  className={cn(
                    "rounded-lg border p-4",
                    getSeverityBg(insight.severity)
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant={
                        insight.severity === "success"
                          ? "success"
                          : insight.severity === "warning"
                          ? "warning"
                          : insight.severity === "critical"
                          ? "danger"
                          : "info"
                      }
                      size="sm"
                    >
                      {insight.category}
                    </Badge>
                    {insight.value !== undefined && (
                      <span
                        className={cn(
                          "text-sm font-bold tabular-nums",
                          getSeverityColor(insight.severity)
                        )}
                      >
                        {insight.value}
                        {insight.metric?.includes("Rate") ||
                        insight.metric?.includes("Margin") ||
                        insight.metric?.includes("Growth")
                          ? "%"
                          : ""}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold mb-1">{insight.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-emerald-400" />
                Raccomandazioni Strategiche ({report.recommendations.length})
              </CardTitle>
            </CardHeader>
            <div className="space-y-3">
              {report.recommendations.map((rec, i) => {
                const isExpanded = expandedRec === rec.id;
                return (
                  <div
                    key={rec.id}
                    className="rounded-lg border border-border/50 overflow-hidden"
                  >
                    <button
                      className="flex items-start gap-4 w-full p-4 text-left hover:bg-accent/20 transition-colors"
                      onClick={() =>
                        setExpandedRec(isExpanded ? null : rec.id)
                      }
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold">{rec.title}</p>
                          <Badge
                            variant={
                              rec.priority === "critical"
                                ? "danger"
                                : rec.priority === "high"
                                ? "warning"
                                : "neutral"
                            }
                            size="sm"
                          >
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-emerald-400 font-medium">
                          Impatto stimato: {rec.estimatedImpact}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className={cn("text-xs font-medium capitalize", EFFORT_COLORS[rec.effort])}>
                            Sforzo: {rec.effort}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {TIMEFRAME_LABELS[rec.timeframe]?.split(" ")[0]}
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border/50 p-4 bg-secondary/20 space-y-3">
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          {rec.description}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div className="p-2.5 rounded-lg bg-card/50 text-center">
                            <p className="text-[10px] text-muted-foreground">Priorità</p>
                            <p className="text-sm font-bold capitalize">{rec.priority}</p>
                          </div>
                          <div className="p-2.5 rounded-lg bg-card/50 text-center">
                            <p className="text-[10px] text-muted-foreground">Sforzo</p>
                            <p className={cn("text-sm font-bold capitalize", EFFORT_COLORS[rec.effort])}>
                              {rec.effort}
                            </p>
                          </div>
                          <div className="p-2.5 rounded-lg bg-card/50 text-center">
                            <p className="text-[10px] text-muted-foreground">Timeframe</p>
                            <p className="text-sm font-bold">
                              {TIMEFRAME_LABELS[rec.timeframe]?.split(" ")[0]}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setCreateTaskFromRec(rec);
                              setDetailRec(null);
                            }}
                          >
                            <CheckSquare className="h-3.5 w-3.5" />
                            Crea task
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDetailRec(rec)}
                          >
                            <Search className="h-3.5 w-3.5" />
                            Analisi approfondita
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      ) : null}

      {/* Modale Analisi approfondita */}
      {detailRec && (
        <Modal
          open={!!detailRec}
          onClose={() => setDetailRec(null)}
          title={detailRec.title}
          description={`Priorità ${detailRec.priority} · Sforzo ${detailRec.effort} · ${TIMEFRAME_LABELS[detailRec.timeframe]}`}
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => setDetailRec(null)}>
                Chiudi
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setCreateTaskFromRec(detailRec);
                  setDetailRec(null);
                }}
              >
                <CheckSquare className="h-3.5 w-3.5" />
                Crea task da questa raccomandazione
              </Button>
            </>
          }
        >
          <div className="space-y-4 py-2">
            <p className="text-sm text-foreground/90 leading-relaxed">
              {detailRec.description}
            </p>
            <div className="rounded-lg bg-secondary/30 p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Piano d&apos;azione suggerito</p>
              <ul className="text-xs space-y-1 list-disc list-inside text-foreground/80">
                <li>Definire obiettivi e criteri di successo</li>
                <li>Assegnare responsabile e deadline</li>
                <li>Creare task nel progetto più pertinente</li>
                <li>Monitorare avanzamento in dashboard</li>
              </ul>
            </div>
          </div>
        </Modal>
      )}

      {/* TaskForm per creare task da raccomandazione */}
      <TaskForm
        open={!!createTaskFromRec}
        onClose={() => setCreateTaskFromRec(null)}
        activityId={activityId}
        projects={projects}
        initialValues={createTaskFromRec ? recToTaskInitial(createTaskFromRec) : undefined}
        onSuccess={() => {
          setCreateTaskFromRec(null);
          toast.success("Task creato! Vai a Progetti per gestirlo.");
          router.push(`/dashboard/${activityId}/projects`);
        }}
      />

      {!report ? (
        <Card className="py-16 text-center">
          <Bot className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground mb-4">
            Nessun report AI generato per {activity.name}
          </p>
          <p className="text-xs text-muted-foreground mb-4 max-w-md mx-auto">
            Seleziona un modulo sopra o clicca per generare un report di analisi basato sui dati dell&apos;attività.
          </p>
          <Button onClick={() => handleGenerate("strategic")} loading={isGenerating}>
            <Sparkles className="h-4 w-4" />
            Genera il tuo primo report AI
          </Button>
        </Card>
      ) : null}
    </div>
  );
}
