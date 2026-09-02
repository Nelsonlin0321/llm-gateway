"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { requireSession } from "@/lib/auth-server";
import { db, llmProviders, models } from "@/lib/db";
import {
  buildModelCreateData,
  toModelListItem,
  validateCreateModelInput,
} from "@/lib/model/service";
import { writeAuditLog } from "@/lib/audit";
import { requireOrganizationPermission } from "@/lib/organization/access";
import { invalidate_llm_provider_and_model_cache } from "@/lib/redis/invalidate";
import { publicMutationError } from "@/lib/safe-error";

import {
  modelReturning,
  modelValidationError,
  revalidateOrganizationModelPaths,
  type ModelActionResult,
} from "./shared";

export async function createModel(input: unknown): Promise<ModelActionResult> {
  const session = await requireSession();
  const parsed = validateCreateModelInput(input);

  if (!parsed.success) {
    return modelValidationError(
      "Please fix the highlighted fields and try again.",
      z.flattenError(parsed.error).fieldErrors,
    );
  }

  const [provider] = await db
    .select({
      id: llmProviders.id,
      name: llmProviders.name,
      compatibilityType: llmProviders.compatibilityType,
      organizationId: llmProviders.organizationId,
    })
    .from(llmProviders)
    .where(eq(llmProviders.id, parsed.data.providerId))
    .limit(1);

  if (!provider) {
    return modelValidationError("Provider not found.");
  }

  const access = await requireOrganizationPermission(
    session.user.id,
    provider.organizationId,
    "model",
    "create",
  );

  if (!access.ok) {
    return modelValidationError(
      "You do not have permission to register models for this provider.",
    );
  }

  try {
    const [model] = await db
      .insert(models)
      .values(
        buildModelCreateData(
          parsed.data,
          provider.name,
          provider.organizationId,
        ),
      )
      .returning(modelReturning);

    revalidateOrganizationModelPaths(provider.organizationId);
    await invalidate_llm_provider_and_model_cache(
      provider.organizationId,
      provider.name,
      provider.compatibilityType,
    );
    await writeAuditLog({
      organizationId: provider.organizationId,
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      action: "create",
      entity: "model",
      entityId: model.id,
      metadata: { alias: model.alias, provider: provider.name },
    });

    return {
      ok: true,
      model: toModelListItem(model, provider.name),
      message: "Model registered successfully.",
    };
  } catch (error) {
    return modelValidationError(
      publicMutationError("Unable to register the model.", error),
    );
  }
}
