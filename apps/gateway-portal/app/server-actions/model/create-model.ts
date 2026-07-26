"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSession } from "@/lib/auth-server";
import {
  buildModelCreateData,
  toModelListItem,
  validateCreateModelInput,
} from "@/lib/model/service";
import prisma from "@/lib/prisma";

import {
  modelSelect,
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

  const provider = await prisma.lLMProvider.findUnique({
    where: { id: parsed.data.providerId },
    select: { id: true, name: true, creatorId: true },
  });

  if (!provider) {
    return modelValidationError("Provider not found.");
  }

  if (provider.creatorId !== session.user.id) {
    return modelValidationError(
      "You do not have permission to register models for this provider.",
    );
  }

  try {
    const model = await prisma.model.create({
      data: buildModelCreateData(parsed.data, provider.name),
      select: modelSelect,
    });

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
