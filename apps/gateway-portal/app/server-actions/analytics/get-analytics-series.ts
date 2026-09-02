"use server";

import { requireSession } from "@/lib/auth-server";
import {
  validateAnalyticsQuery,
  type AnalyticsQueryInput,
  type AnalyticsSeriesResult,
} from "@/lib/analytics/schema";
import { fetchAnalyticsSeries } from "@/lib/analytics/service";
import { requireOrganizationPermission } from "@/lib/organization/access";

export type GetAnalyticsSeriesResult =
  | { ok: true; data: AnalyticsSeriesResult }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

export async function getAnalyticsSeries(
  input: AnalyticsQueryInput,
): Promise<GetAnalyticsSeriesResult> {
  const session = await requireSession();

  const parsed = validateAnalyticsQuery(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid analytics query.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const access = await requireOrganizationPermission(
    session.user.id,
    parsed.data.organizationId,
    "organization",
    "view",
  );
  if (!access.ok) {
    return { ok: false, error: access.error };
  }

  try {
    const data = await fetchAnalyticsSeries(parsed.data);
    return { ok: true, data };
  } catch (error) {
    console.error("[getAnalyticsSeries]", error);
    return {
      ok: false,
      error: "Failed to load analytics series. Please try again.",
    };
  }
}
