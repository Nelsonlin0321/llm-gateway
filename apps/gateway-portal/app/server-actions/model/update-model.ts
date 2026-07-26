"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSession } from "@/lib/auth-server";
import {
  buildModelUpdateData,
  toModelListItem,
  validateUpdateModelInput,
} from "@/lib/model/service";
import prisma from "@/lib/prisma";

import {
  modelSelect,
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

  const existing = await prisma.model.findFirst({
    where: {
      id: parsed.data.id,
      provider: {
        creatorId: session.user.id,
      },
    },
    select: {
      id: true,
      providerId: true,
      provider: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!existing) {
    return modelValidationError("Model not found.");
  }

  try {
    const model = await prisma.model.update({
      where: { id: existing.id },
      data: buildModelUpdateData(parsed.data, existing.provider.name),
      select: modelSelect,
    });

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
