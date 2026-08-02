"use server";

import { requireSession } from "@/lib/auth-server";
import type { AnalyticsMetaResult } from "@/lib/analytics/schema";
import { fetchAnalyticsMeta } from "@/lib/analytics/service";

export type GetAnalyticsMetaResult =
  | { ok: true; data: AnalyticsMetaResult }
  | { ok: false; error: string };

export async function getAnalyticsMeta(): Promise<GetAnalyticsMetaResult> {
  await requireSession();

  try {
    const data = await fetchAnalyticsMeta();
    return { ok: true, data };
  } catch (error) {
    console.error("[getAnalyticsMeta]", error);
    return {
      ok: false,
      error: "Failed to load analytics dimensions and filters.",
    };
  }
}
