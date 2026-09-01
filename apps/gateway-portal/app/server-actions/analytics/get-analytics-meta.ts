"use server";

import { requireSession } from "@/lib/auth-server";
import type { AnalyticsMetaResult } from "@/lib/analytics/schema";
import { fetchAnalyticsMeta } from "@/lib/analytics/service";
import { requireOrganizationPermission } from "@/lib/organization/access";

export type GetAnalyticsMetaResult =
  | { ok: true; data: AnalyticsMetaResult }
  | { ok: false; error: string };

export async function getAnalyticsMeta(
  organizationId: string,
): Promise<GetAnalyticsMetaResult> {
  const session = await requireSession();
  const access = await requireOrganizationPermission(
    session.user.id,
    organizationId,
    "organization",
    "view",
  );
  if (!access.ok) {
    return { ok: false, error: access.error };
  }

  try {
    const data = await fetchAnalyticsMeta(access.organizationId);
    return { ok: true, data };
  } catch (error) {
    console.error("[getAnalyticsMeta]", error);
    return {
      ok: false,
      error: "Failed to load analytics dimensions and filters.",
    };
  }
}
