"use server";

import { eq } from "drizzle-orm";

import { db, llmProviders } from "@/lib/db";
import { requireSession } from "@/lib/auth-server";
import { toProviderListItem } from "@/lib/llm-provider/service";
import {
  mutationDeniedMessage,
  requireOrganizationPermission,
} from "@/lib/organization/access";

import {
  providerReturning,
  revalidateOrganizationProviderPaths,
  validationErrorResult,
  type ProviderActionResult,
} from "./shared";

export async function deleteProvider(
  id: string,
): Promise<ProviderActionResult> {
  const session = await requireSession();

  if (!id.trim()) {
    return validationErrorResult("Provider id is required.");
  }

  const [existing] = await db
    .select({
      id: llmProviders.id,
      organizationId: llmProviders.organizationId,
    })
    .from(llmProviders)
    .where(eq(llmProviders.id, id))
    .limit(1);

  if (!existing) {
    return validationErrorResult("Provider not found.");
  }

  const access = await requireOrganizationPermission(
    session.user.id,
    existing.organizationId,
    "llmProvider",
    "delete",
  );

  if (!access.ok) {
    return validationErrorResult(mutationDeniedMessage(access));
  }

  try {
    const [provider] = await db
      .delete(llmProviders)
      .where(eq(llmProviders.id, id))
      .returning(providerReturning);

    revalidateOrganizationProviderPaths(existing.organizationId);

    return {
      ok: true,
      provider: toProviderListItem(provider),
      message: "Provider deleted successfully.",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete the provider.";

    return validationErrorResult(message);
  }
}
