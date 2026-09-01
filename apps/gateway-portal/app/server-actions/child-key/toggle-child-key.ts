"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { requireSession } from "@/lib/auth-server";
import { validateToggleChildKeyInput } from "@/lib/child-key/service";
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
    .select({
      id: childKeys.id,
      organizationId: childKeys.organizationId,
    })
    .from(childKeys)
    .where(eq(childKeys.id, parsed.data.id))
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
    const [childKey] = await db
      .update(childKeys)
      .set({ isActive: parsed.data.isActive })
      .where(eq(childKeys.id, existing.id))
      .returning(childKeyReturning);

    revalidateOrganizationChildKeyPaths(existing.organizationId);

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
