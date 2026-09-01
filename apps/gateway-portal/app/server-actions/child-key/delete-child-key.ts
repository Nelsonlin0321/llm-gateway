"use server";

import { eq } from "drizzle-orm";

import { requireSession } from "@/lib/auth-server";
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

export async function deleteChildKey(
  id: string,
): Promise<ChildKeyActionResult> {
  const session = await requireSession();

  if (!id.trim()) {
    return childKeyValidationError("Child key id is required.");
  }

  const [existing] = await db
    .select({
      id: childKeys.id,
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
    "delete",
  );

  if (!access.ok) {
    return childKeyValidationError(mutationDeniedMessage(access));
  }

  try {
    const [childKey] = await db
      .delete(childKeys)
      .where(eq(childKeys.id, existing.id))
      .returning(childKeyReturning);

    await invalidate_child_key_cache(id);
    revalidateOrganizationChildKeyPaths(existing.organizationId);

    return childKeySuccess(childKey, "Child key deleted successfully.");
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to delete the child key.";
    return childKeyValidationError(message);
  }
}
