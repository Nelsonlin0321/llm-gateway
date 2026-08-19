import { randomUUID } from "node:crypto";

import type { Model } from "@/lib/db/schema";
import {
  buildModelAlias,
  createModelInputSchema,
  getModelsInputSchema,
  modelListQuerySchema,
  updateModelInputSchema,
  type CreateModelInput,
  type ModelListItem,
  type ModelListQuery,
  type UpdateModelInput,
} from "@/lib/model/schema";

type ModelRecord = Pick<
  Model,
  | "id"
  | "name"
  | "alias"
  | "inputPrice"
  | "outputPrice"
  | "inputCachePrice"
  | "providerId"
  | "createdAt"
  | "updatedAt"
>;

export function validateCreateModelInput(input: unknown) {
  return createModelInputSchema.safeParse(input);
}

export function validateUpdateModelInput(input: unknown) {
  return updateModelInputSchema.safeParse(input);
}

export function validateGetModelsInput(input: unknown) {
  return getModelsInputSchema.safeParse(input);
}

export function buildModelNameTsQuery(raw: string): string | null {
  const tokens = raw
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0)
    .slice(0, 8);

  if (tokens.length === 0) {
    return null;
  }

  return tokens.map((token) => `${token}:*`).join(" & ");
}

export function buildModelsWhereClause(
  organizationId: string,
  options?: ModelListQuery,
) {
  const parsed = modelListQuerySchema.parse(options ?? {});
  const nameSearch = parsed.q ? buildModelNameTsQuery(parsed.q) : null;

  return {
    organizationId,
    ...(parsed.providerId ? { providerId: parsed.providerId } : {}),
    ...(parsed.compatibilityType
      ? { compatibilityType: parsed.compatibilityType }
      : {}),
    ...(nameSearch ? { nameSearch } : {}),
  };
}

export function buildModelCreateData(
  input: CreateModelInput,
  providerName: string,
  organizationId: string,
) {
  return {
    id: randomUUID(),
    name: input.name,
    alias: buildModelAlias(providerName, input.alias),
    inputPrice: input.inputPrice,
    outputPrice: input.outputPrice,
    inputCachePrice: input.inputCachePrice,
    providerId: input.providerId,
    organizationId,
  };
}

export function buildModelUpdateData(
  input: UpdateModelInput,
  providerName: string,
) {
  return {
    name: input.name,
    alias: buildModelAlias(providerName, input.alias),
    inputPrice: input.inputPrice,
    outputPrice: input.outputPrice,
    inputCachePrice: input.inputCachePrice,
  };
}

export function toModelListItem(
  model: ModelRecord,
  providerName = "",
): ModelListItem {
  return {
    id: model.id,
    name: model.name,
    alias: model.alias,
    inputPrice: model.inputPrice,
    outputPrice: model.outputPrice,
    inputCachePrice: model.inputCachePrice,
    providerId: model.providerId,
    providerName,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  };
}
