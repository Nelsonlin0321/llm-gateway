"use server";

import { eq } from "drizzle-orm";

import { requireSession } from "@/lib/auth-server";
import { db, llmProviders, models } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { toModelListItem } from "@/lib/model/service";
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

export async function deleteModel(id: string): Promise<ModelActionResult> {
  const session = await requireSession();

  if (!id.trim()) {
    return modelValidationError("Model id is required.");
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
    .where(eq(models.id, id))
    .limit(1);

  if (!existing) {
    return modelValidationError("Model not found.");
  }

  const access = await requireOrganizationPermission(
    session.user.id,
    existing.organizationId,
    "model",
    "delete",
  );

  if (!access.ok) {
    return modelValidationError(mutationDeniedMessage(access));
  }

  try {
    const [model] = await db
      .delete(models)
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
      action: "delete",
      entity: "model",
      entityId: existing.id,
    });

    return {
      ok: true,
      model: toModelListItem(model, existing.providerName),
      message: "Model deregistered successfully.",
    };
  } catch (error) {
    return modelValidationError(
      publicMutationError("Unable to deregister the model.", error),
    );
  }
}
