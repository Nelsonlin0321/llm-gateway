"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { requireSession } from "@/lib/auth-server";
import { db, llmProviders, models } from "@/lib/db";
import {
  buildModelUpdateData,
  toModelListItem,
  validateUpdateModelInput,
} from "@/lib/model/service";

import {
  modelReturning,
  modelValidationError,
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
      providerId: models.providerId,
      providerName: llmProviders.name,
    })
    .from(models)
    .innerJoin(llmProviders, eq(models.providerId, llmProviders.id))
    .where(
      and(
        eq(models.id, parsed.data.id),
        eq(llmProviders.creatorId, session.user.id),
      ),
    )
    .limit(1);

  if (!existing) {
    return modelValidationError("Model not found.");
  }

  try {
    const [model] = await db
      .update(models)
      .set(buildModelUpdateData(parsed.data, existing.providerName))
      .where(eq(models.id, existing.id))
      .returning(modelReturning);

    revalidatePath(`/workspace/${existing.providerId}/models`);
    revalidatePath("/workspace/providers");

    return {
      ok: true,
      model: toModelListItem(model),
      message: "Model updated successfully.",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update the model.";
    return modelValidationError(message);
  }
}
