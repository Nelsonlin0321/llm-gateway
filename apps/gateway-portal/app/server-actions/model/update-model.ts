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
import { getOrganizationMembership } from "@/lib/organization/service";

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
    })
    .from(models)
    .innerJoin(llmProviders, eq(models.providerId, llmProviders.id))
    .where(eq(models.id, parsed.data.id))
    .limit(1);

  if (!existing) {
    return modelValidationError("Model not found.");
  }

  const membership = await getOrganizationMembership(
    session.user.id,
    existing.organizationId,
  );

  if (!membership) {
    return modelValidationError("Model not found.");
  }

  try {
    const [model] = await db
      .update(models)
      .set(buildModelUpdateData(parsed.data, existing.providerName))
      .where(eq(models.id, existing.id))
      .returning(modelReturning);

    revalidateOrganizationModelPaths(existing.organizationId);

    return {
      ok: true,
      model: toModelListItem(model, existing.providerName),
      message: "Model updated successfully.",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update the model.";
    return modelValidationError(message);
  }
}
