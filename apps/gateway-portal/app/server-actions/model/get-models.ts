"use server";

import { and, desc, eq, sql } from "drizzle-orm";

import { requireSession } from "@/lib/auth-server";
import { db, llmProviders, models } from "@/lib/db";
import type { ModelListItem, ProviderSummary } from "@/lib/model/schema";
import {
  buildModelsWhereClause,
  toModelListItem,
  validateGetModelsInput,
} from "@/lib/model/service";
import { requireOrganizationPermission } from "@/lib/organization/access";

import { modelReturning } from "./shared";

export type GetModelsResult =
  | {
      ok: true;
      providers: ProviderSummary[];
      models: ModelListItem[];
    }
  | {
      ok: false;
      error: string;
      code: "not_found" | "forbidden" | "validation";
    };

export async function getModelsForOrganization(
  input: unknown,
): Promise<GetModelsResult> {
  const session = await requireSession();
  const parsed = validateGetModelsInput(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: "Organization id is required.",
      code: "validation",
    };
  }

  const { organizationId } = parsed.data;
  const access = await requireOrganizationPermission(
    session.user.id,
    organizationId,
    "model",
    "view",
  );

  if (!access.ok) {
    return {
      ok: false,
      error: "You do not have access to models for this organization.",
      code: "forbidden",
    };
  }

  const filters = buildModelsWhereClause(organizationId, parsed.data);
  const modelConditions = [eq(models.organizationId, filters.organizationId)];
  if (filters.providerId) {
    modelConditions.push(eq(models.providerId, filters.providerId));
  }
  if (filters.compatibilityType) {
    modelConditions.push(
      eq(llmProviders.compatibilityType, filters.compatibilityType),
    );
  }
  if (filters.nameSearch) {
    modelConditions.push(
      sql`to_tsvector('simple', ${models.name}) @@ to_tsquery('simple', ${filters.nameSearch})`,
    );
  }

  const [providerRows, modelRows] = await Promise.all([
    db
      .select({
        id: llmProviders.id,
        name: llmProviders.name,
        apiUrl: llmProviders.apiUrl,
        compatibilityType: llmProviders.compatibilityType,
        isActive: llmProviders.isActive,
      })
      .from(llmProviders)
      .where(eq(llmProviders.organizationId, organizationId))
      .orderBy(desc(llmProviders.isActive), desc(llmProviders.updatedAt)),
    db
      .select({
        ...modelReturning,
        providerName: llmProviders.name,
      })
      .from(models)
      .innerJoin(llmProviders, eq(models.providerId, llmProviders.id))
      .where(and(...modelConditions))
      .orderBy(desc(models.updatedAt)),
  ]);

  return {
    ok: true,
    providers: providerRows,
    models: modelRows.map((row) =>
      toModelListItem(row, row.providerName),
    ),
  };
}
