"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { db, llmProviders } from "@/lib/db";
import { requireSession } from "@/lib/auth-server";
import { toProviderListItem } from "@/lib/llm-provider/service";

import {
  providerReturning,
  validationErrorResult,
  type ProviderActionResult,
} from "./shared";

export async function deleteProvider(
  id: string,
): Promise<ProviderActionResult> {
  const session = await requireSession();

  if (!id.trim()) {
    return validationErrorResult("Provider id is required.");
  }

  const [existing] = await db
    .select({ id: llmProviders.id })
    .from(llmProviders)
    .where(
      and(eq(llmProviders.id, id), eq(llmProviders.creatorId, session.user.id)),
    )
    .limit(1);

  if (!existing) {
    return validationErrorResult("Provider not found.");
  }

  try {
    const [provider] = await db
      .delete(llmProviders)
      .where(eq(llmProviders.id, id))
      .returning(providerReturning);

    revalidatePath("/providers");
    revalidatePath("/dashboard");

    return {
      ok: true,
      provider: toProviderListItem(provider),
      message: "Provider deleted successfully.",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete the provider.";

    return validationErrorResult(message);
  }
}
