"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth-server";
import prisma from "@/lib/prisma";

import {
  childKeySelect,
  childKeySuccess,
  childKeyValidationError,
  type ChildKeyActionResult,
} from "./shared";

export async function deleteChildKey(id: string): Promise<ChildKeyActionResult> {
  const session = await requireSession();

  if (!id.trim()) {
    return childKeyValidationError("Child key id is required.");
  }

  const existing = await prisma.childKey.findFirst({
    where: {
      id,
      creatorId: session.user.id,
    },
    select: { id: true },
  });

  if (!existing) {
    return childKeyValidationError("Child key not found.");
  }

  try {
    const childKey = await prisma.childKey.delete({
      where: { id: existing.id },
      select: childKeySelect,
    });

    revalidatePath("/workspace/child-keys");

    return childKeySuccess(childKey, "Child key deleted successfully.");
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to delete the child key.";
    return childKeyValidationError(message);
  }
}
