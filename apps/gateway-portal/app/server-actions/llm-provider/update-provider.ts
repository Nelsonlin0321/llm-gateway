"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import {
  buildProviderUpdateData,
  toProviderListItem,
  validateUpdateProviderInput,
} from "@/lib/llm-provider/service";

import {
  providerSelect,
  validationErrorResult,
  type ProviderActionResult,
} from "./shared";

export async function updateProvider(
  input: unknown,
): Promise<ProviderActionResult> {
  const session = await requireSession();
  const parsed = validateUpdateProviderInput(input);

  if (!parsed.success) {
    return validationErrorResult(
      "Please fix the highlighted fields and try again.",
      z.flattenError(parsed.error).fieldErrors,
    );
  }

  const existing = await prisma.lLMProvider.findFirst({
    where: {
      id: parsed.data.id,
      creatorId: session.user.id,
    },
    select: {
      id: true,
      encryptedApiKey: true,
    },
  });

  if (!existing) {
    return validationErrorResult("Provider not found.");
  }

  const duplicate = await prisma.lLMProvider.findFirst({
    where: {
      name: parsed.data.name,
      compatibilityType: parsed.data.compatibilityType,
      NOT: {
        id: parsed.data.id,
      },
    },
    select: { id: true },
  });

  if (duplicate) {
    return validationErrorResult(
      "A provider with this name and compatibility already exists.",
      { name: ["Choose a unique provider prefix for this compatibility."] },
    );
  }

  try {
    const provider = await prisma.lLMProvider.update({
      where: { id: parsed.data.id },
      data: buildProviderUpdateData(existing.encryptedApiKey, parsed.data),
      select: providerSelect,
    });

    revalidatePath("/providers");
    revalidatePath("/dashboard");

    return {
      ok: true,
      provider: toProviderListItem(provider),
      message: "Provider updated successfully.",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update the provider.";

    return validationErrorResult(message);
  }
}
