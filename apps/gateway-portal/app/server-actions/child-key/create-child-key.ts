"use server";

import { z } from "zod";

import { requireSession } from "@/lib/auth-server";
import {
  buildChildKeyCreateData,
  validateCreateChildKeyInput,
} from "@/lib/child-key/service";
import { db, childKeys } from "@/lib/db";
import { requireOrganizationPermission } from "@/lib/organization/access";
import { resolveActiveOrganizationId } from "@/lib/organization/service";

import {
  childKeyReturning,
  childKeySuccess,
  childKeyValidationError,
  revalidateOrganizationChildKeyPaths,
  type ChildKeyActionResult,
} from "./shared";

export async function createChildKey(
  input: unknown,
  organizationId?: string | null,
): Promise<ChildKeyActionResult> {
  const session = await requireSession();
  const resolvedOrganizationId =
    organizationId?.trim() ||
    (await resolveActiveOrganizationId(session));
  const access = await requireOrganizationPermission(
    session.user.id,
    resolvedOrganizationId,
    "childKey",
    "create",
  );

  if (!access.ok) {
    return childKeyValidationError(
      access.code === "no_organization"
        ? "Select an organization before creating a child API key."
        : access.error,
    );
  }

  const parsed = validateCreateChildKeyInput(input);

  if (!parsed.success) {
    return childKeyValidationError(
      "Please fix the highlighted fields and try again.",
      z.flattenError(parsed.error).fieldErrors,
    );
  }

  try {
    const { data, apiKey } = await buildChildKeyCreateData(
      parsed.data,
      {
        id: session.user.id,
      },
      access.organizationId,
    );

    const [childKey] = await db
      .insert(childKeys)
      .values(data)
      .returning(childKeyReturning);

    revalidateOrganizationChildKeyPaths(access.organizationId);

    return childKeySuccess(
      childKey,
      "Child API key created. Copy it now, or reveal it later from the list.",
      apiKey,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create the child API key.";
    return childKeyValidationError(message);
  }
}
