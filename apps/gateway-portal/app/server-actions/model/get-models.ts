"use server";

import { desc, eq } from "drizzle-orm";

import { requireSession } from "@/lib/auth-server";
import { db, llmProviders, models } from "@/lib/db";
import {
  toModelListItem,
  validateGetModelsInput,
} from "@/lib/model/service";
import type { ModelListItem, ProviderSummary } from "@/lib/model/schema";

import { modelReturning } from "./shared";

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

  const [provider] = await db
    .select({
      id: llmProviders.id,
      name: llmProviders.name,
      apiUrl: llmProviders.apiUrl,
      compatibilityType: llmProviders.compatibilityType,
      isActive: llmProviders.isActive,
      creatorId: llmProviders.creatorId,
    })
    .from(llmProviders)
    .where(eq(llmProviders.id, parsed.data.providerId))
    .limit(1);

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

  const modelRows = await db
    .select(modelReturning)
    .from(models)
    .where(eq(models.providerId, provider.id))
    .orderBy(desc(models.updatedAt));

  return {
    ok: true,
    provider: {
      id: provider.id,
      name: provider.name,
      apiUrl: provider.apiUrl,
      compatibilityType: provider.compatibilityType,
      isActive: provider.isActive,
    },
    models: modelRows.map(toModelListItem),
  };
}
