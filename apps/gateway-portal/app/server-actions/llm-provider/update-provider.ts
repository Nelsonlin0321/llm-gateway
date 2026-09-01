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
import { writeAuditLog } from "@/lib/audit";
import {
  mutationDeniedMessage,
  requireOrganizationPermission,
} from "@/lib/organization/access";
import { invalidate_llm_provider_and_model_cache } from "@/lib/redis/invalidate";
import { publicMutationError } from "@/lib/safe-error";

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
      name: llmProviders.name,
      compatibilityType: llmProviders.compatibilityType,
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
    await invalidate_llm_provider_and_model_cache(
      existing.organizationId,
      existing.name,
      existing.compatibilityType,
    );
    if (
      existing.name !== parsed.data.name ||
      existing.compatibilityType !== parsed.data.compatibilityType
    ) {
      await invalidate_llm_provider_and_model_cache(
        existing.organizationId,
        parsed.data.name,
        parsed.data.compatibilityType,
      );
    }
    await writeAuditLog({
      organizationId: existing.organizationId,
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      action: "update",
      entity: "llmProvider",
      entityId: provider.id,
      metadata: { name: provider.name },
    });

    return {
      ok: true,
      provider: toProviderListItem(provider),
      message: "Provider updated successfully.",
    };
  } catch (error) {
    return validationErrorResult(
      publicMutationError("Unable to update the provider.", error),
    );
  }
}
