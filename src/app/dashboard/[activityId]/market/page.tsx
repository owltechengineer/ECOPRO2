"use client";

import { use, useState, useCallback } from "react";
import type { MarketProfile } from "@/types";
import { notFound } from "next/navigation";
import { useActivity } from "@/hooks/useActivity";
import { ActivityActions } from "@/components/dashboard/ActivityActions";
import { getMarketProfile } from "@/actions/market";
import { generateAIMarketProfile } from "@/actions/ai-market";
import { cn, formatCurrency } from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientOnly } from "@/components/ui/client-only";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Globe,
  TrendingUp,
  Users,
  Target,
  Zap,
  RefreshCw,
  Shield,
  Lightbulb,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { getSectorProfile } from "@/data/sector-market-profiles";
import type { Activity } from "@/types";

function buildSyntheticProfile(activityId: string, activity: Pick<Activity, "sector" | "name">): MarketProfile {
  const sectorProfile = getSectorProfile(activity.sector, activity.name);
  return {
    id: `syn-${activityId}`,
    activityId,
    marketSize: sectorProfile.marketSize,
    servicableMarket: sectorProfile.servicableMarket,
    targetMarket: sectorProfile.targetMarket,
    growthRate: sectorProfile.growthRate,
    competitorIntensity: sectorProfile.competitorIntensity,
    pricingAverage: sectorProfile.pricingAverage,
    pricingLabel: sectorProfile.pricingLabel,
    barriersToEntry: sectorProfile.barriersToEntry,
    keyTrends: sectorProfile.keyTrends,
    lastUpdated: new Date().toISOString(),
  };
}

export default function MarketPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const { activityId } = use(params);
  const activity = useActivity(activityId);
  if (!activity) return notFound();

  const [market, setMarket] = useState<MarketProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const aiResult = await generateAIMarketProfile(activityId, {
        name: activity.name,
        sector: activity.sector,
        description: activity.description,
        businessModels: activity.businessModels,
        geography: activity.geography,
      });
      if (aiResult.ok) {
        setMarket(aiResult.data);
      } else {
        const dbResult = await getMarketProfile(activityId);
        if (dbResult.ok && dbResult.data) {
          setMarket(dbResult.data);
        } else {
          setMarket(buildSyntheticProfile(activityId, activity));
          if (aiResult.error?.includes("GROQ")) setError(aiResult.error);
        }
      }
    } catch {
      const dbResult = await getMarketProfile(activityId);
      if (dbResult.ok && dbResult.data) setMarket(dbResult.data);
      else setMarket(buildSyntheticProfile(activityId, activity));
      setError("Connessione non disponibile");
    } finally {
      setLoading(false);
    }
  }, [activityId, activity]);

  const intensityConfig = {
    low: { label: "Bassa", color: "text-emerald-400", bg: "bg-emerald-500/10 ring-emerald-500/20" },
    medium: { label: "Media", color: "text-amber-400", bg: "bg-amber-500/10 ring-amber-500/20" },
    high: { label: "Alta", color: "text-orange-400", bg: "bg-orange-500/10 ring-orange-500/20" },
    very_high: { label: "Molto Alta", color: "text-red-400", bg: "bg-red-500/10 ring-red-500/20" },
  };

  const marketSizeData = market
    ? [
        { name: "TAM", value: market.marketSize, color: "#6366f1" },
        { name: "SAM", value: market.servicableMarket, color: "#8b5cf6" },
        { name: "SOM", value: market.targetMarket, color: "#a78bfa" },
      ]
    : [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold truncate">{activity.name} — Market</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Analisi mercato, trend e competitor
          </p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <ActivityActions activity={activity} />
          {market && (
            <Button variant="outline" size="sm" disabled={loading} onClick={runAnalysis}>
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Nuova analisi
            </Button>
          )}
        </div>
      </div>

      {error && market && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <Card className="py-16 text-center">
          <Loader2 className="h-12 w-12 text-muted-foreground/50 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Analisi mercato in corso...</p>
          <p className="text-xs text-muted-foreground mt-1">Lettura dati {activity.name}</p>
        </Card>
      ) : !market ? (
        <Card className="py-16 text-center">
          <Globe className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">
            Analisi mercato su richiesta
          </p>
          <p className="text-xs text-muted-foreground mb-6 max-w-md mx-auto">
            Clicca per avviare l&apos;analisi del mercato attuale. L&apos;AI legge le informazioni dell&apos;attività e genera una stima specifica.
          </p>
          <Button size="lg" onClick={runAnalysis}>
            <Zap className="h-4 w-4" />
            Analizza mercato ora
          </Button>
        </Card>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Analisi generata il {new Date(market.lastUpdated).toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" })}
          </p>
          {/* Market size overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              {
                label: "TAM — Total Addressable Market",
                value: market.marketSize,
                desc: "Dimensione totale del mercato",
                icon: Globe,
                color: "#6366f1",
              },
              {
                label: "SAM — Serviceable Addressable",
                value: market.servicableMarket,
                desc: "Mercato raggiungibile",
                icon: Target,
                color: "#8b5cf6",
              },
              {
                label: "SOM — Serviceable Obtainable",
                value: market.targetMarket,
                desc: "Quota obiettivo",
                icon: Users,
                color: "#a78bfa",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg sm:rounded-xl border border-border/50 bg-card p-3 sm:p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <item.icon
                    className="h-5 w-5"
                    style={{ color: item.color }}
                  />
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: item.color }}
                  >
                    {item.label.split("—")[0].trim()}
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-black tabular-nums">
                  {formatCurrency(item.value, "EUR", true)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
            <div className="kpi-card">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span className="data-label">Crescita mercato</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-emerald-400">
                +{market.growthRate}%
              </span>
              <span className="text-xs text-muted-foreground">anno/anno</span>
            </div>

            <div className="kpi-card">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="data-label">Competizione</span>
              </div>
              <span
                className={cn(
                  "text-xl sm:text-2xl font-bold",
                  intensityConfig[market.competitorIntensity as keyof typeof intensityConfig]?.color
                )}
              >
                {intensityConfig[market.competitorIntensity as keyof typeof intensityConfig]?.label}
              </span>
            </div>

            <div className="kpi-card">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="data-label">Prezzo medio mercato</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold">
                {formatCurrency(market.pricingAverage)}
              </span>
              {market.pricingLabel && (
                <span className="text-[10px] text-muted-foreground leading-tight block mt-0.5">
                  {market.pricingLabel}
                </span>
              )}
            </div>

            <div className="kpi-card">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="data-label">Quota potenziale</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold">
                {((market.targetMarket / market.servicableMarket) * 100).toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">del SAM</span>
            </div>
          </div>

          {/* TAM/SAM/SOM chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Size Breakdown</CardTitle>
              </CardHeader>
              <ClientOnly fallback={<div className="h-[180px] bg-secondary/20 rounded animate-pulse" />}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={marketSizeData}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) =>
                      v >= 1_000_000_000
                        ? `${(v / 1_000_000_000).toFixed(1)}B`
                        : v >= 1_000_000
                        ? `${(v / 1_000_000).toFixed(0)}M`
                        : `${(v / 1000).toFixed(0)}K`
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    width={35}
                  />
                  <Tooltip
                    formatter={(value: number) =>
                      formatCurrency(value, "EUR", true)
                    }
                    contentStyle={{
                      background: "hsl(222 47% 7%)",
                      border: "1px solid hsl(222 40% 12%)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
                    {marketSizeData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              </ClientOnly>
            </Card>

            {/* Barriers to entry */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-400" />
                  Barriere all&apos;Ingresso
                </CardTitle>
              </CardHeader>
              <div className="space-y-2">
                {market.barriersToEntry.map((barrier, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-xs">{barrier}</span>
                  </div>
                ))}
                {market.barriersToEntry.length === 0 && (
                  <p className="text-xs text-muted-foreground">Nessuna barriera identificata</p>
                )}
              </div>
            </Card>
          </div>

          {/* Key Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Trend Chiave di Mercato
              </CardTitle>
              <Button variant="ghost" size="sm">
                <Zap className="h-3.5 w-3.5" />
                AI Analysis
              </Button>
            </CardHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {market.keyTrends.map((trend, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/20 shrink-0">
                    <Lightbulb className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <p className="text-xs leading-relaxed">{trend}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Activity context */}
          <Card>
            <CardHeader>
              <CardTitle>Posizionamento {activity.name}</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Settori target</p>
                <div className="flex flex-wrap gap-2">
                  {activity.geography.map((geo) => (
                    <Badge key={geo} variant="info">{geo}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Business model</p>
                <div className="flex flex-wrap gap-2">
                  {activity.businessModels.map((bm) => (
                    <Badge key={bm} variant="default">{bm.toUpperCase()}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Stage</p>
                <Badge
                  variant={
                    activity.lifecycleStage === "growth"
                      ? "success"
                      : activity.lifecycleStage === "validation"
                      ? "warning"
                      : "info"
                  }
                >
                  {activity.lifecycleStage}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Intensità competizione</p>
                <span
                  className={cn(
                    "badge",
                    intensityConfig[market.competitorIntensity as keyof typeof intensityConfig]?.bg
                  )}
                >
                  {intensityConfig[market.competitorIntensity as keyof typeof intensityConfig]?.label}
                </span>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function Plus({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
