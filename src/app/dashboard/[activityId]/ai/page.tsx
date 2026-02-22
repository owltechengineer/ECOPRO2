"use client";

import { use, useState } from "react";
import type { AIReport } from "@/types";
import { notFound } from "next/navigation";
import { useActivity } from "@/hooks/useActivity";
import { ActivityActions } from "@/components/dashboard/ActivityActions";
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
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles,
} from "lucide-react";

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

export default function AIPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const { activityId } = use(params);
  const activity = useActivity(activityId);
  if (!activity) return notFound();

  const report = null as AIReport | null;
  const [expandedRec, setExpandedRec] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  const handleGenerate = (promptId: string) => {
    setSelectedPrompt(promptId);
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 2000);
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
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="secondary">
                            Crea task da questa raccomandazione
                          </Button>
                          <Button size="sm" variant="ghost">
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
      ) : (
        <Card className="py-16 text-center">
          <Bot className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground mb-4">
            Nessun report AI generato per {activity.name}
          </p>
          <Button onClick={() => handleGenerate("strategic")} loading={isGenerating}>
            <Sparkles className="h-4 w-4" />
            Genera il tuo primo report AI
          </Button>
        </Card>
      )}
    </div>
  );
}
