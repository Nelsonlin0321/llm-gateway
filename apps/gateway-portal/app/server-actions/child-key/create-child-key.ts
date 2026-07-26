"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSession } from "@/lib/auth-server";
import {
  buildChildKeyCreateData,
  validateCreateChildKeyInput,
} from "@/lib/child-key/service";
import prisma from "@/lib/prisma";

import {
  childKeySelect,
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
      email: session.user.email,
    });

    const childKey = await prisma.childKey.create({
      data,
      select: childKeySelect,
    });

    revalidatePath("/workspace/child-keys");

    return childKeySuccess(
      childKey,
      "Child API key created. Copy it now — it will not be shown again in full.",
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
