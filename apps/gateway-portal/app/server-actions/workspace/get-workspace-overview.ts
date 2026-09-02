"use server";

import { requireSession } from "@/lib/auth-server";
import { requireOrganizationPermission } from "@/lib/organization/access";
import { resolveActiveOrganizationId } from "@/lib/organization/service";
import {
  fetchWorkspaceOverview,
  type WorkspaceOverview,
} from "@/lib/workspace/overview";

export type GetWorkspaceOverviewResult =
  | { ok: true; data: WorkspaceOverview }
  | { ok: false; error: string };

export async function getWorkspaceOverview(
  organizationId?: string | null,
): Promise<GetWorkspaceOverviewResult> {
  const session = await requireSession();
  const resolvedOrganizationId =
    organizationId?.trim() ||
    (await resolveActiveOrganizationId(session));
  const access = await requireOrganizationPermission(
    session.user.id,
    resolvedOrganizationId,
    "organization",
    "view",
  );

  if (!access.ok) {
    return { ok: false, error: access.error };
  }

  try {
    const data = await fetchWorkspaceOverview(access.organizationId);
    return { ok: true, data };
  } catch (error) {
    console.error("[getWorkspaceOverview]", error);
    return {
      ok: false,
      error: "Failed to load workspace overview. Please try again.",
    };
  }
}
