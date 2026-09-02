"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db, user } from "@/lib/db";
import { requireSession } from "@/lib/auth-server";
import { validateUpdateProfileInput } from "@/lib/profile/service";

import {
  profileReturning,
  validationErrorResult,
  type ProfileActionResult,
} from "./shared";

export async function updateProfile(
  input: unknown,
): Promise<ProfileActionResult> {
  const session = await requireSession();
  const parsed = validateUpdateProfileInput(input);

  if (!parsed.success) {
    return validationErrorResult(
      "Please fix the highlighted fields and try again.",
      z.flattenError(parsed.error).fieldErrors,
    );
  }

  try {
    const [updatedUser] = await db
      .update(user)
      .set({
        name: parsed.data.name,
        image: parsed.data.image ?? null,
      })
      .where(eq(user.id, session.user.id))
      .returning(profileReturning);

    revalidatePath("/profile/setting");
    revalidatePath("/workspace");

    return {
      ok: true,
      user: updatedUser,
      message: "Profile updated successfully.",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update profile.";

    return validationErrorResult(message);
  }
}
