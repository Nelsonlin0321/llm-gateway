"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSession } from "@/lib/auth-server";
import {
  buildChildKeyCreateData,
  validateCreateChildKeyInput,
} from "@/lib/child-key/service";
import { db, childKeys } from "@/lib/db";

import {
  childKeyReturning,
  childKeySuccess,
  childKeyValidationError,
  type ChildKeyActionResult,
} from "./shared";

export async function createChildKey(
  input: unknown,
): Promise<ChildKeyActionResult> {
  const session = await requireSession();
  const parsed = validateCreateChildKeyInput(input);

  if (!parsed.success) {
    return childKeyValidationError(
      "Please fix the highlighted fields and try again.",
      z.flattenError(parsed.error).fieldErrors,
    );
  }

  try {
    const { data, apiKey } = await buildChildKeyCreateData(parsed.data, {
      id: session.user.id,
    });

    const [childKey] = await db
      .insert(childKeys)
      .values(data)
      .returning(childKeyReturning);

    revalidatePath("/workspace/child-keys");

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
