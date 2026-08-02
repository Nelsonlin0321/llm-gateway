"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { requireSession } from "@/lib/auth-server";
import { validateToggleChildKeyInput } from "@/lib/child-key/service";
import { db, childKeys } from "@/lib/db";

import {
  childKeyReturning,
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

  const [existing] = await db
    .select({ id: childKeys.id })
    .from(childKeys)
    .where(
      and(
        eq(childKeys.id, parsed.data.id),
        eq(childKeys.creatorId, session.user.id),
      ),
    )
    .limit(1);

  if (!existing) {
    return childKeyValidationError("Child key not found.");
  }

  try {
    const [childKey] = await db
      .update(childKeys)
      .set({ isActive: parsed.data.isActive })
      .where(eq(childKeys.id, existing.id))
      .returning(childKeyReturning);

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
