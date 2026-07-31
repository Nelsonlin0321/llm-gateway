import { randomUUID } from "node:crypto";

import type { LLMProvider } from "@/lib/db/schema";
import {
  createProviderInputSchema,
  getProvidersOptionsSchema,
  type CreateProviderInput,
  type GetProvidersOptions,
  type ProviderListItem,
  type UpdateProviderInput,
  updateProviderInputSchema,
} from "@/lib/llm-provider/schema";
import { encryptApiKey } from "@/lib/llm-provider/crypto";

type ProviderRecord = Pick<
  LLMProvider,
  | "id"
  | "name"
  | "apiUrl"
  | "compatibilityType"
  | "isActive"
  | "encryptedApiKey"
  | "createdAt"
  | "updatedAt"
>;

export function validateCreateProviderInput(input: unknown) {
  return createProviderInputSchema.safeParse(input);
}

export function validateUpdateProviderInput(input: unknown) {
  return updateProviderInputSchema.safeParse(input);
}

export function validateGetProvidersOptions(input: unknown) {
  return getProvidersOptionsSchema.safeParse(input);
}

export function buildProviderCreateData(
  input: CreateProviderInput,
  creatorId: string,
) {
  return {
    id: randomUUID(),
    name: input.name,
    apiUrl: input.apiUrl,
    encryptedApiKey: encryptApiKey(input.apiKey),
    compatibilityType: input.compatibilityType,
    isActive: input.isActive,
    creatorId,
  };
}

export function buildProviderUpdateData(
  existingEncryptedApiKey: string,
  input: UpdateProviderInput,
) {
  return {
    name: input.name,
    apiUrl: input.apiUrl,
    encryptedApiKey: input.apiKey
      ? encryptApiKey(input.apiKey)
      : existingEncryptedApiKey,
    compatibilityType: input.compatibilityType,
    isActive: input.isActive,
  };
}

export function buildProvidersWhereClause(
  creatorId: string,
  options?: GetProvidersOptions,
) {
  const parsed = getProvidersOptionsSchema.parse(options);

  return {
    creatorId,
    ...(parsed?.includeInactive ? {} : { isActive: true as const }),
  };
}

export function toProviderListItem(provider: ProviderRecord): ProviderListItem {
  return {
    id: provider.id,
    name: provider.name,
    apiUrl: provider.apiUrl,
    compatibilityType: provider.compatibilityType,
    isActive: provider.isActive,
    hasStoredApiKey: Boolean(provider.encryptedApiKey),
    createdAt: provider.createdAt.toISOString(),
    updatedAt: provider.updatedAt.toISOString(),
  };
}
