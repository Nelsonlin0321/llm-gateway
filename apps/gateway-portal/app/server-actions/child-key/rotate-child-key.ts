"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth-server";
import { buildChildKeyRotateData } from "@/lib/child-key/service";
import prisma from "@/lib/prisma";

import {
  childKeySelect,
  childKeySuccess,
  childKeyValidationError,
  type ChildKeyActionResult,
} from "./shared";

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

  const existing = await prisma.childKey.findFirst({
    where: {
      id,
      creatorId: session.user.id,
    },
    select: {
      id: true,
      name: true,
      userEmail: true,
      tags: true,
      expiresAt: true,
      issuedAt: true,
      key: true,
    },
  });

  if (!existing) {
    return childKeyValidationError("Child key not found.");
  }

  try {
    const { data, apiKey } = await buildChildKeyRotateData(existing);

    const childKey = await prisma.childKey.update({
      where: { id: existing.id },
      data,
      select: childKeySelect,
    });

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
