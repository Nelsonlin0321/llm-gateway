"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth-server";
import { toModelListItem } from "@/lib/model/service";
import prisma from "@/lib/prisma";

import {
  modelSelect,
  modelValidationError,
  type ModelActionResult,
} from "./shared";

export async function deleteModel(id: string): Promise<ModelActionResult> {
  const session = await requireSession();

  if (!id.trim()) {
    return modelValidationError("Model id is required.");
  }

  const existing = await prisma.model.findFirst({
    where: {
      id,
      provider: {
        creatorId: session.user.id,
      },
    },
    select: {
      id: true,
      providerId: true,
    },
  });

  if (!existing) {
    return modelValidationError("Model not found.");
  }

  try {
    const model = await prisma.model.delete({
      where: { id: existing.id },
      select: modelSelect,
    });

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
