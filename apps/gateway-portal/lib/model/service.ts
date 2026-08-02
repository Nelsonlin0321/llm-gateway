import { randomUUID } from "node:crypto";

import type { Model } from "@/lib/db/schema";
import {
  buildModelAlias,
  createModelInputSchema,
  getModelsInputSchema,
  updateModelInputSchema,
  type CreateModelInput,
  type ModelListItem,
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

export function buildModelCreateData(
  input: CreateModelInput,
  providerName: string,
) {
  return {
    id: randomUUID(),
    name: input.name,
    alias: buildModelAlias(providerName, input.alias),
    inputPrice: input.inputPrice,
    outputPrice: input.outputPrice,
    inputCachePrice: input.inputCachePrice,
    providerId: input.providerId,
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

export function toModelListItem(model: ModelRecord): ModelListItem {
  return {
    id: model.id,
    name: model.name,
    alias: model.alias,
    inputPrice: model.inputPrice,
    outputPrice: model.outputPrice,
    inputCachePrice: model.inputCachePrice,
    providerId: model.providerId,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  };
}
