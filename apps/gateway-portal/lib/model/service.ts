import { randomUUID } from "node:crypto";

import type { Model } from "@/generated/prisma/client";
import {
  buildModelAlias,
  createModelInputSchema,
  getModelsInputSchema,
  type CreateModelInput,
  type ModelListItem,
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
