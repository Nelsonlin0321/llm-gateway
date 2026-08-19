"use server";

import { and, desc, eq, sql } from "drizzle-orm";

import { db, llmProviders } from "@/lib/db";
import { requireSession } from "@/lib/auth-server";
import {
  buildProvidersWhereClause,
  toProviderListItem,
  validateGetProvidersOptions,
} from "@/lib/llm-provider/service";
import type { GetProvidersOptions } from "@/lib/llm-provider/schema";
import { resolveActiveOrganizationId } from "@/lib/organization/service";

import { providerReturning } from "./shared";

export async function getProviders(options?: GetProvidersOptions) {
  const session = await requireSession();
  const organizationId = await resolveActiveOrganizationId(session);

  if (!organizationId) {
    return [];
  }

  const parsed = validateGetProvidersOptions(options);

  if (!parsed.success) {
    return [];
  }

  const filters = buildProvidersWhereClause(organizationId, parsed.data);
  const conditions = [eq(llmProviders.organizationId, filters.organizationId)];
  if ("isActive" in filters && filters.isActive !== undefined) {
    conditions.push(eq(llmProviders.isActive, filters.isActive));
  }
  if ("compatibilityType" in filters && filters.compatibilityType) {
    conditions.push(
      eq(llmProviders.compatibilityType, filters.compatibilityType),
    );
  }
  if ("nameSearch" in filters && filters.nameSearch) {
    conditions.push(
      sql`to_tsvector('simple', ${llmProviders.name}) @@ to_tsquery('simple', ${filters.nameSearch})`,
    );
  }

  const providers = await db
    .select(providerReturning)
    .from(llmProviders)
    .where(and(...conditions))
    .orderBy(desc(llmProviders.isActive), desc(llmProviders.updatedAt));

  return providers.map(toProviderListItem);
}
