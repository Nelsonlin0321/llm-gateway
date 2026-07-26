"use server";

import { requireSession } from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import {
  toModelListItem,
  validateGetModelsInput,
} from "@/lib/model/service";
import type { ModelListItem, ProviderSummary } from "@/lib/model/schema";

import { modelSelect } from "./shared";

export type GetModelsResult =
  | {
      ok: true;
      provider: ProviderSummary;
      models: ModelListItem[];
    }
  | {
      ok: false;
      error: string;
      code: "not_found" | "forbidden" | "validation";
    };

export async function getModelsForProvider(
  input: unknown,
): Promise<GetModelsResult> {
  const session = await requireSession();
  const parsed = validateGetModelsInput(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: "Provider id is required.",
      code: "validation",
    };
  }

  const provider = await prisma.lLMProvider.findUnique({
    where: { id: parsed.data.providerId },
    select: {
      id: true,
      name: true,
      apiUrl: true,
      compatibilityType: true,
      isActive: true,
      creatorId: true,
    },
  });

  if (!provider) {
    return {
      ok: false,
      error: "Provider not found.",
      code: "not_found",
    };
  }

  if (provider.creatorId !== session.user.id) {
    return {
      ok: false,
      error: "You do not have access to models for this provider.",
      code: "forbidden",
    };
  }

  const models = await prisma.model.findMany({
    where: { providerId: provider.id },
    select: modelSelect,
    orderBy: [{ updatedAt: "desc" }],
  });

  return {
    ok: true,
    provider: {
      id: provider.id,
      name: provider.name,
      apiUrl: provider.apiUrl,
      compatibilityType: provider.compatibilityType,
      isActive: provider.isActive,
    },
    models: models.map(toModelListItem),
  };
}
