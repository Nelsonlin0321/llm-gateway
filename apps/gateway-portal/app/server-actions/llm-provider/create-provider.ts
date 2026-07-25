"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import {
  buildProviderCreateData,
  toProviderListItem,
  validateCreateProviderInput,
} from "@/lib/llm-provider/service";

import {
  providerSelect,
  validationErrorResult,
  type ProviderActionResult,
} from "./shared";

export async function createProvider(
  input: unknown,
): Promise<ProviderActionResult> {
  const session = await requireSession();
  const parsed = validateCreateProviderInput(input);

  if (!parsed.success) {
    return validationErrorResult(
      "Please fix the highlighted fields and try again.",
      z.flattenError(parsed.error).fieldErrors,
    );
  }

  const duplicate = parsed.data.isActive
    ? await prisma.lLMProvider.findFirst({
        where: {
          creatorId: session.user.id,
          name: parsed.data.name,
          isActive: true,
        },
        select: { id: true },
      })
    : null;

  if (duplicate) {
    return validationErrorResult(
      "An active provider with this name already exists.",
      { name: ["Choose a unique provider prefix."] },
    );
  }

  try {
    const provider = await prisma.lLMProvider.create({
      data: buildProviderCreateData(parsed.data, session.user.id),
      select: providerSelect,
    });

    revalidatePath("/providers");
    revalidatePath("/dashboard");

    return {
      ok: true,
      provider: toProviderListItem(provider),
      message: "Provider created successfully.",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create the provider.";

    return validationErrorResult(message);
  }
}
