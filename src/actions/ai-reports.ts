"use server";

import { chat, isAiConfigured } from "@/lib/ai";
import { ok, fail, type ActionResult } from "./types";
import type { AIReport, AIInsight, AIRecommendation, Activity } from "@/types";

function extractJson<T>(text: string): T | null {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  const raw = match[1]?.trim() ?? text.trim();
  try {
    return JSON.parse(raw) as T;
  } catch {
    try {
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  }
}

const SEVERITIES = ["success", "info", "warning", "critical"] as const;
const PRIORITIES = ["critical", "high", "medium", "low"] as const;
const EFFORTS = ["low", "medium", "high"] as const;
const TIMEFRAMES = ["immediate", "short_term", "medium_term", "long_term"] as const;

function sanitizeInsight(i: unknown): AIInsight | null {
  if (!i || typeof i !== "object") return null;
  const o = i as Record<string, unknown>;
  return {
    id: `i-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    category: String(o.category ?? "Info"),
    title: String(o.title ?? ""),
    description: String(o.description ?? ""),
    severity: (SEVERITIES.includes(String(o.severity) as typeof SEVERITIES[number]) ? o.severity : "info") as AIInsight["severity"],
    metric: o.metric ? String(o.metric) : undefined,
    value: typeof o.value === "number" ? o.value : undefined,
  };
}

function sanitizeRec(r: unknown): AIRecommendation | null {
  if (!r || typeof r !== "object") return null;
  const o = r as Record<string, unknown>;
  return {
    id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: String(o.title ?? ""),
    description: String(o.description ?? ""),
    priority: (PRIORITIES.includes(String(o.priority) as typeof PRIORITIES[number]) ? o.priority : "medium") as AIRecommendation["priority"],
    estimatedImpact: String(o.estimatedImpact ?? "Medio"),
    effort: (EFFORTS.includes(String(o.effort) as typeof EFFORTS[number]) ? o.effort : "medium") as AIRecommendation["effort"],
    timeframe: (TIMEFRAMES.includes(String(o.timeframe) as typeof TIMEFRAMES[number]) ? o.timeframe : "short_term") as AIRecommendation["timeframe"],
  };
}

export async function generateAIReport(
  activity: Pick<Activity, "name" | "sector" | "description" | "businessModels" | "geography" | "lifecycleStage">,
  promptId: string,
  promptLabel: string,
  userPrompt: string
): Promise<ActionResult<AIReport>> {
  if (!isAiConfigured()) {
    return fail("Configura GROQ_API_KEY in .env.local. Ottienila gratis su https://console.groq.com");
  }

  const context = `
Attività: ${activity.name}
Settore: ${activity.sector}
Descrizione: ${activity.description ?? "—"}
Modelli di business: ${activity.businessModels.join(", ")}
Geografia: ${activity.geography.join(", ")}
Stage: ${activity.lifecycleStage}
`.trim();

  const systemPrompt = `Sei un consulente strategico. Analizza l'attività e rispondi SOLO con un JSON valido, senza altro testo.
Formato richiesto:
{
  "summary": "paragrafo di 2-4 frasi con analisi sintetica",
  "insights": [
    { "category": "string", "title": "string", "description": "string", "severity": "success|info|warning|critical", "metric": "string opzionale", "value": numero opzionale }
  ],
  "recommendations": [
    { "title": "string", "description": "string", "priority": "critical|high|medium|low", "estimatedImpact": "string", "effort": "low|medium|high", "timeframe": "immediate|short_term|medium_term|long_term" }
  ]
}
Fornisci esattamente 3 insights e 3 recommendations. Usa severity appropriata. Scrivi in italiano.`;

  const userMessage = `${userPrompt}\n\nContesto attività:\n${context}\n\nRispondi solo con il JSON.`;

  const { text, error } = await chat(systemPrompt, userMessage, { maxTokens: 2048, temperature: 0.6 });

  if (error) return fail(error);
  if (!text.trim()) return fail("Risposta AI vuota");

  const parsed = extractJson<{ summary?: string; insights?: unknown[]; recommendations?: unknown[] }>(text);
  if (!parsed) return fail("Impossibile parsare la risposta AI come JSON");

  const insights = (parsed.insights ?? [])
    .map(sanitizeInsight)
    .filter((x): x is AIInsight => x !== null)
    .slice(0, 5);
  const recommendations = (parsed.recommendations ?? [])
    .map(sanitizeRec)
    .filter((x): x is AIRecommendation => x !== null)
    .slice(0, 5);

  if (insights.length === 0 && recommendations.length === 0) {
    return fail("La risposta AI non contiene insights o raccomandazioni valide");
  }

  const report: AIReport = {
    id: `ai-${Date.now()}`,
    activityId: "", // filled by caller if needed
    type: promptId as AIReport["type"],
    title: `${promptLabel} — ${activity.name}`,
    summary: String(parsed.summary ?? "Analisi completata.").slice(0, 2000),
    insights: insights.length > 0 ? insights : [{ id: "i1", category: "Analisi", title: "Report generato", description: parsed.summary ?? "Analisi completata dall'AI.", severity: "info" }],
    recommendations: recommendations.length > 0 ? recommendations : [],
    generatedAt: new Date().toISOString(),
    dataSnapshot: {},
  };

  return ok(report);
}
