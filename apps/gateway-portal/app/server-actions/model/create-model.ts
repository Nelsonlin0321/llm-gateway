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
import { requireOrganizationPermission } from "@/lib/organization/access";

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

    return {
      ok: true,
      model: toModelListItem(model, provider.name),
      message: "Model registered successfully.",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to register the model.";
    return modelValidationError(message);
  }
}
