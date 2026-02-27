"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { ok, fail, type ActionResult } from "./types";
import type { MarketProfile } from "@/types";

function mapProfile(row: {
  id: string;
  activity_id: string;
  market_size: number;
  servicable_market: number;
  target_market: number;
  growth_rate: number;
  competitor_intensity: string;
  pricing_average: number;
  barriers_to_entry: string[];
  key_trends: string[];
  last_updated: string;
}): MarketProfile {
  return {
    id: row.id,
    activityId: row.activity_id,
    marketSize: Number(row.market_size),
    servicableMarket: Number(row.servicable_market),
    targetMarket: Number(row.target_market),
    growthRate: Number(row.growth_rate),
    competitorIntensity: (row.competitor_intensity || "medium") as MarketProfile["competitorIntensity"],
    pricingAverage: Number(row.pricing_average),
    barriersToEntry: row.barriers_to_entry ?? [],
    keyTrends: row.key_trends ?? [],
    lastUpdated: row.last_updated,
  };
}

export async function getMarketProfile(
  activityId: string
): Promise<ActionResult<MarketProfile | null>> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("market_profiles")
    .select("*")
    .eq("activity_id", activityId)
    .maybeSingle();

  if (error) return fail(error.message);
  return ok(data ? mapProfile(data) : null);
}
