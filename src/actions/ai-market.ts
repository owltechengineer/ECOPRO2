"use server";

import { chat, isAiConfigured } from "@/lib/ai";
import { ok, fail, type ActionResult } from "./types";
import type { MarketProfile } from "@/types";
import type { Activity } from "@/types";

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

const INTENSITIES = ["low", "medium", "high", "very_high"] as const;

export async function generateAIMarketProfile(
  activityId: string,
  activity: Pick<Activity, "name" | "sector" | "description" | "businessModels" | "geography">
): Promise<ActionResult<MarketProfile>> {
  if (!isAiConfigured()) {
    return fail("Configura GROQ_API_KEY in .env.local. Ottienila gratis su https://console.groq.com");
  }

  const context = `
Attività: ${activity.name}
Settore: ${activity.sector}
Descrizione: ${activity.description ?? "—"}
Modelli: ${activity.businessModels.join(", ")}
Mercati: ${activity.geography.join(", ")}
`.trim();

  const systemPrompt = `Sei un analista di mercato. Stima dati realistici per l'attività. Rispondi SOLO con JSON valido.
Formato:
{
  "marketSize": numero (TAM in euro, es. 4200000000 per 4.2 mld),
  "servicableMarket": numero (SAM in euro),
  "targetMarket": numero (SOM in euro),
  "growthRate": numero (crescita % annua, es. 12),
  "competitorIntensity": "low"|"medium"|"high"|"very_high",
  "pricingAverage": numero (prezzo medio in euro),
  "pricingLabel": "stringa che descrive l'unità di prezzo, es. 'per licenza SaaS/mese' o 'al m² — piastrella 60×60'",
  "barriersToEntry": ["barriera1", "barriera2", "barriera3"],
  "keyTrends": ["trend1", "trend2", "trend3"]
}
Sii specifico per il settore. pricingLabel deve essere concreto (es. "€45/m² ceramica 60×60" per ceramica, "€89/utente/mese" per SaaS).
Scrivi in italiano.`;

  const userMessage = `Analizza il mercato per questa attività e fornisci stime realistiche.\n\n${context}\n\nRispondi solo con il JSON.`;

  const { text, error } = await chat(systemPrompt, userMessage, { maxTokens: 1024, temperature: 0.5 });

  if (error) return fail(error);
  if (!text.trim()) return fail("Risposta AI vuota");

  const parsed = extractJson<{
    marketSize?: number;
    servicableMarket?: number;
    targetMarket?: number;
    growthRate?: number;
    competitorIntensity?: string;
    pricingAverage?: number;
    pricingLabel?: string;
    barriersToEntry?: string[];
    keyTrends?: string[];
  }>(text);

  if (!parsed) return fail("Impossibile parsare la risposta AI come JSON");

  const intensity = INTENSITIES.includes((parsed.competitorIntensity as typeof INTENSITIES[number]) ?? "medium")
    ? parsed.competitorIntensity
    : "medium";

  const profile: MarketProfile = {
    id: `ai-${Date.now()}`,
    activityId,
    marketSize: Math.max(0, Number(parsed.marketSize) || 1_000_000_000),
    servicableMarket: Math.max(0, Number(parsed.servicableMarket) || 100_000_000),
    targetMarket: Math.max(0, Number(parsed.targetMarket) || 5_000_000),
    growthRate: Math.max(0, Math.min(100, Number(parsed.growthRate) || 8)),
    competitorIntensity: intensity as MarketProfile["competitorIntensity"],
    pricingAverage: Math.max(0, Number(parsed.pricingAverage) || 100),
    pricingLabel: parsed.pricingLabel ? String(parsed.pricingLabel).slice(0, 120) : undefined,
    barriersToEntry: Array.isArray(parsed.barriersToEntry)
      ? parsed.barriersToEntry.map(String).filter(Boolean).slice(0, 6)
      : [],
    keyTrends: Array.isArray(parsed.keyTrends)
      ? parsed.keyTrends.map(String).filter(Boolean).slice(0, 6)
      : [],
    lastUpdated: new Date().toISOString(),
  };

  return ok(profile);
}
