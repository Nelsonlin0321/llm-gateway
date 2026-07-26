"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSession } from "@/lib/auth-server";
import { validateToggleChildKeyInput } from "@/lib/child-key/service";
import prisma from "@/lib/prisma";

import {
  childKeySelect,
  childKeySuccess,
  childKeyValidationError,
  type ChildKeyActionResult,
} from "./shared";

export async function toggleChildKey(
  input: unknown,
): Promise<ChildKeyActionResult> {
  const session = await requireSession();
  const parsed = validateToggleChildKeyInput(input);

  if (!parsed.success) {
    return childKeyValidationError(
      "Please fix the highlighted fields and try again.",
      z.flattenError(parsed.error).fieldErrors,
    );
  }

  const existing = await prisma.childKey.findFirst({
    where: {
      id: parsed.data.id,
      creatorId: session.user.id,
    },
    select: { id: true },
  });

  if (!existing) {
    return childKeyValidationError("Child key not found.");
  }

  try {
    const childKey = await prisma.childKey.update({
      where: { id: existing.id },
      data: { isActive: parsed.data.isActive },
      select: childKeySelect,
    });

    revalidatePath("/workspace/child-keys");

    return childKeySuccess(
      childKey,
      parsed.data.isActive
        ? "Child key activated."
        : "Child key deactivated.",
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to update the child key status.";
    return childKeyValidationError(message);
  }
}
