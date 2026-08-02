"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { requireSession } from "@/lib/auth-server";
import { db, llmProviders, models } from "@/lib/db";
import { toModelListItem } from "@/lib/model/service";

import {
  modelReturning,
  modelValidationError,
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
      providerId: models.providerId,
    })
    .from(models)
    .innerJoin(llmProviders, eq(models.providerId, llmProviders.id))
    .where(
      and(eq(models.id, id), eq(llmProviders.creatorId, session.user.id)),
    )
    .limit(1);

  if (!existing) {
    return modelValidationError("Model not found.");
  }

  try {
    const [model] = await db
      .delete(models)
      .where(eq(models.id, existing.id))
      .returning(modelReturning);

    revalidatePath(`/workspace/${existing.providerId}/models`);
    revalidatePath("/workspace/providers");

    return {
      ok: true,
      model: toModelListItem(model),
      message: "Model deregistered successfully.",
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to deregister the model.";
    return modelValidationError(message);
  }
}
