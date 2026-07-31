"use server";

import { and, desc, eq } from "drizzle-orm";

import { db, llmProviders } from "@/lib/db";
import { requireSession } from "@/lib/auth-server";
import {
  buildProvidersWhereClause,
  toProviderListItem,
  validateGetProvidersOptions,
} from "@/lib/llm-provider/service";
import type { GetProvidersOptions } from "@/lib/llm-provider/schema";

import { providerReturning } from "./shared";

export async function getProviders(options?: GetProvidersOptions) {
  const session = await requireSession();
  const parsed = validateGetProvidersOptions(options);

  if (!parsed.success) {
    return [];
  }

  const filters = buildProvidersWhereClause(session.user.id, parsed.data);
  const conditions = [eq(llmProviders.creatorId, filters.creatorId)];
  if ("isActive" in filters && filters.isActive !== undefined) {
    conditions.push(eq(llmProviders.isActive, filters.isActive));
  }

  const providers = await db
    .select(providerReturning)
    .from(llmProviders)
    .where(and(...conditions))
    .orderBy(desc(llmProviders.isActive), desc(llmProviders.updatedAt));

  return providers.map(toProviderListItem);
}
