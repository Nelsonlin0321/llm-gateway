"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { requireSession } from "@/lib/auth-server";
import { db, llmProviders, models } from "@/lib/db";
import {
  buildModelCreateData,
  toModelListItem,
  validateCreateModelInput,
} from "@/lib/model/service";

import {
  modelReturning,
  modelValidationError,
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
      creatorId: llmProviders.creatorId,
    })
    .from(llmProviders)
    .where(eq(llmProviders.id, parsed.data.providerId))
    .limit(1);

  if (!provider) {
    return modelValidationError("Provider not found.");
  }

  if (provider.creatorId !== session.user.id) {
    return modelValidationError(
      "You do not have permission to register models for this provider.",
    );
  }

  try {
    const [model] = await db
      .insert(models)
      .values(buildModelCreateData(parsed.data, provider.name))
      .returning(modelReturning);

    revalidatePath(`/workspace/${provider.id}/models`);
    revalidatePath("/workspace/providers");

    return {
      ok: true,
      model: toModelListItem(model),
      message: "Model registered successfully.",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to register the model.";
    return modelValidationError(message);
  }
}
