"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { toProviderListItem } from "@/lib/llm-provider/service";

import {
  providerSelect,
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

  const existing = await prisma.lLMProvider.findFirst({
    where: {
      id,
      creatorId: session.user.id,
    },
    select: { id: true },
  });

  if (!existing) {
    return validationErrorResult("Provider not found.");
  }

  try {
    const provider = await prisma.lLMProvider.delete({
      where: { id },
      select: providerSelect,
    });

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
