"use server";

import { requireSession } from "@/lib/auth-server";
import {
  fetchWorkspaceOverview,
  type WorkspaceOverview,
} from "@/lib/workspace/overview";

export type GetWorkspaceOverviewResult =
  | { ok: true; data: WorkspaceOverview }
  | { ok: false; error: string };

export async function getWorkspaceOverview(): Promise<GetWorkspaceOverviewResult> {
  const session = await requireSession();

  try {
    const data = await fetchWorkspaceOverview(session.user.id);
    return { ok: true, data };
  } catch (error) {
    console.error("[getWorkspaceOverview]", error);
    return {
      ok: false,
      error: "Failed to load workspace overview. Please try again.",
    };
  }
}
