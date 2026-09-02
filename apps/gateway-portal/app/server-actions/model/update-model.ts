"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { requireSession } from "@/lib/auth-server";
import { db, llmProviders, models } from "@/lib/db";
import {
  buildModelUpdateData,
  toModelListItem,
  validateUpdateModelInput,
} from "@/lib/model/service";
import { writeAuditLog } from "@/lib/audit";
import {
  mutationDeniedMessage,
  requireOrganizationPermission,
} from "@/lib/organization/access";
import { invalidate_llm_provider_and_model_cache } from "@/lib/redis/invalidate";
import { publicMutationError } from "@/lib/safe-error";

import {
  modelReturning,
  modelValidationError,
  revalidateOrganizationModelPaths,
  type ModelActionResult,
} from "./shared";

export async function updateModel(input: unknown): Promise<ModelActionResult> {
  const session = await requireSession();
  const parsed = validateUpdateModelInput(input);

  if (!parsed.success) {
    return modelValidationError(
      "Please fix the highlighted fields and try again.",
      z.flattenError(parsed.error).fieldErrors,
    );
  }

  const [existing] = await db
    .select({
      id: models.id,
      organizationId: models.organizationId,
      providerName: llmProviders.name,
      compatibilityType: llmProviders.compatibilityType,
    })
    .from(models)
    .innerJoin(llmProviders, eq(models.providerId, llmProviders.id))
    .where(eq(models.id, parsed.data.id))
    .limit(1);

  if (!existing) {
    return modelValidationError("Model not found.");
  }

  const access = await requireOrganizationPermission(
    session.user.id,
    existing.organizationId,
    "model",
    "update",
  );

  if (!access.ok) {
    return modelValidationError(mutationDeniedMessage(access));
  }

  try {
    const [model] = await db
      .update(models)
      .set(buildModelUpdateData(parsed.data, existing.providerName))
      .where(eq(models.id, existing.id))
      .returning(modelReturning);

    revalidateOrganizationModelPaths(existing.organizationId);
    await invalidate_llm_provider_and_model_cache(
      existing.organizationId,
      existing.providerName,
      existing.compatibilityType,
    );
    await writeAuditLog({
      organizationId: existing.organizationId,
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      action: "update",
      entity: "model",
      entityId: model.id,
      metadata: { alias: model.alias },
    });

    return {
      ok: true,
      model: toModelListItem(model, existing.providerName),
      message: "Model updated successfully.",
    };
  } catch (error) {
    return modelValidationError(
      publicMutationError("Unable to update the model.", error),
    );
  }
}
