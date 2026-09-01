"use server";

import { eq } from "drizzle-orm";

import { requireSession } from "@/lib/auth-server";
import { buildChildKeyRotateData } from "@/lib/child-key/service";
import { db, childKeys } from "@/lib/db";
import {
  mutationDeniedMessage,
  requireOrganizationPermission,
} from "@/lib/organization/access";

import {
  childKeyReturning,
  childKeySuccess,
  childKeyValidationError,
  revalidateOrganizationChildKeyPaths,
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
      expiresAt: childKeys.expiresAt,
      issuedAt: childKeys.issuedAt,
      organizationId: childKeys.organizationId,
    })
    .from(childKeys)
    .where(eq(childKeys.id, id))
    .limit(1);

  if (!existing) {
    return childKeyValidationError("Child key not found.");
  }

  const access = await requireOrganizationPermission(
    session.user.id,
    existing.organizationId,
    "childKey",
    "update",
  );

  if (!access.ok) {
    return childKeyValidationError(mutationDeniedMessage(access));
  }

  try {
    const { data, apiKey } = await buildChildKeyRotateData(existing);

    const [childKey] = await db
      .update(childKeys)
      .set(data)
      .where(eq(childKeys.id, existing.id))
      .returning(childKeyReturning);

    await invalidate_child_key_cache(id);
    revalidateOrganizationChildKeyPaths(existing.organizationId);

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
