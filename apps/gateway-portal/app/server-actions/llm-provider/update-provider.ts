"use server";

import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { db, llmProviders } from "@/lib/db";
import { requireSession } from "@/lib/auth-server";
import {
  buildProviderUpdateData,
  toProviderListItem,
  validateUpdateProviderInput,
} from "@/lib/llm-provider/service";
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

export async function updateProvider(
  input: unknown,
): Promise<ProviderActionResult> {
  const session = await requireSession();
  const parsed = validateUpdateProviderInput(input);

  if (!parsed.success) {
    return validationErrorResult(
      "Please fix the highlighted fields and try again.",
      z.flattenError(parsed.error).fieldErrors,
    );
  }

  const [existing] = await db
    .select({
      id: llmProviders.id,
      encryptedApiKey: llmProviders.encryptedApiKey,
      organizationId: llmProviders.organizationId,
    })
    .from(llmProviders)
    .where(eq(llmProviders.id, parsed.data.id))
    .limit(1);

  if (!existing) {
    return validationErrorResult("Provider not found.");
  }

  const access = await requireOrganizationPermission(
    session.user.id,
    existing.organizationId,
    "llmProvider",
    "update",
  );

  if (!access.ok) {
    return validationErrorResult(mutationDeniedMessage(access));
  }

  const [duplicate] = await db
    .select({ id: llmProviders.id })
    .from(llmProviders)
    .where(
      and(
        eq(llmProviders.organizationId, existing.organizationId),
        eq(llmProviders.name, parsed.data.name),
        eq(llmProviders.compatibilityType, parsed.data.compatibilityType),
        ne(llmProviders.id, parsed.data.id),
      ),
    )
    .limit(1);

  if (duplicate) {
    return validationErrorResult(
      "A provider with this name and compatibility already exists.",
      { name: ["Choose a unique provider prefix for this compatibility."] },
    );
  }

  try {
    const [provider] = await db
      .update(llmProviders)
      .set(buildProviderUpdateData(existing.encryptedApiKey, parsed.data))
      .where(eq(llmProviders.id, parsed.data.id))
      .returning(providerReturning);

    revalidateOrganizationProviderPaths(existing.organizationId);

    return {
      ok: true,
      provider: toProviderListItem(provider),
      message: "Provider updated successfully.",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update the provider.";

    return validationErrorResult(message);
  }
}
