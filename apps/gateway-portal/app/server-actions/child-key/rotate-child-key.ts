"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { requireSession } from "@/lib/auth-server";
import { buildChildKeyRotateData } from "@/lib/child-key/service";
import { db, childKeys } from "@/lib/db";

import {
  childKeyReturning,
  childKeySuccess,
  childKeyValidationError,
  type ChildKeyActionResult,
} from "./shared";
import { invalidate_child_key_cache } from "@/lib/redis/invalidate";

/**
 * Re-issue a new plain `sk_…` secret for an existing child key.
 *
 * Keeps `id` stable; updates `issuedAt` + encrypted `key`. The previous
 * secret can no longer be revealed. Gateway invalidates old JWTs when it
 * checks DB `issuedAt` / ciphertext (gateway task 006/016).
 */
export async function rotateChildKey(
  id: string,
): Promise<ChildKeyActionResult> {
  const session = await requireSession();

  if (!id.trim()) {
    return childKeyValidationError("Child key id is required.");
  }

  const [existing] = await db
    .select({
      id: childKeys.id,
      name: childKeys.name,
      creatorId: childKeys.creatorId,
      userEmail: childKeys.userEmail,
      tags: childKeys.tags,
      expiresAt: childKeys.expiresAt,
      issuedAt: childKeys.issuedAt,
      key: childKeys.key,
    })
    .from(childKeys)
    .where(
      and(eq(childKeys.id, id), eq(childKeys.creatorId, session.user.id)),
    )
    .limit(1);

  if (!existing) {
    return childKeyValidationError("Child key not found.");
  }

  try {
    const { data, apiKey } = await buildChildKeyRotateData(existing);

    const [childKey] = await db
      .update(childKeys)
      .set(data)
      .where(eq(childKeys.id, existing.id))
      .returning(childKeyReturning);

    await invalidate_child_key_cache(id);
    revalidatePath("/workspace/child-keys");

    return childKeySuccess(
      childKey,
      "Child API key rotated. Copy the new secret now — the previous secret no longer works.",
      apiKey,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to rotate the child API key.";
    return childKeyValidationError(message);
  }
}
