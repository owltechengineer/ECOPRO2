/**
 * AI Client — Groq (gratuito, veloce)
 * https://console.groq.com — 14.400 req/giorno gratis, nessuna carta richiesta
 */

import Groq from "groq-sdk";

const groqKey = process.env.GROQ_API_KEY;

export function isAiConfigured(): boolean {
  return !!groqKey;
}

export async function chat(
  systemPrompt: string,
  userPrompt: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<{ text: string; error?: string }> {
  if (!groqKey) {
    return { text: "", error: "GROQ_API_KEY non configurata. Ottienila gratis su https://console.groq.com" };
  }

  try {
    const groq = new Groq({ apiKey: groqKey });
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: options?.maxTokens ?? 2048,
      temperature: options?.temperature ?? 0.7,
    });
    const text = completion.choices[0]?.message?.content ?? "";
    return { text };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Errore chiamata AI";
    return { text: "", error: msg };
  }
}
