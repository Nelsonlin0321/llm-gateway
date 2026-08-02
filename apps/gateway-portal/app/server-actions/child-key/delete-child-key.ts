"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { requireSession } from "@/lib/auth-server";
import { db, childKeys } from "@/lib/db";

import {
  childKeyReturning,
  childKeySuccess,
  childKeyValidationError,
  type ChildKeyActionResult,
} from "./shared";
import { invalidate_child_key_cache } from "@/lib/redis/invalidate";

export async function deleteChildKey(
  id: string,
): Promise<ChildKeyActionResult> {
  const session = await requireSession();

  if (!id.trim()) {
    return childKeyValidationError("Child key id is required.");
  }

  const [existing] = await db
    .select({ id: childKeys.id })
    .from(childKeys)
    .where(
      and(eq(childKeys.id, id), eq(childKeys.creatorId, session.user.id)),
    )
    .limit(1);

  if (!existing) {
    return childKeyValidationError("Child key not found.");
  }

  try {
    const [childKey] = await db
      .delete(childKeys)
      .where(eq(childKeys.id, existing.id))
      .returning(childKeyReturning);

    await invalidate_child_key_cache(id);
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
