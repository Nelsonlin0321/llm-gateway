import { z } from "zod";

const positivePriceSchema = z.coerce
  .number({ error: "Enter a valid number." })
  .positive("Price must be a positive number.");

const modelNameSchema = z
  .string()
  .trim()
  .min(1, "Model name is required.")
  .max(128, "Model name must be 128 characters or fewer.");

/** Downstream segment only — full route is `{providerName}/{alias}`. */
const modelAliasSuffixSchema = z
  .string()
  .trim()
  .min(1, "Downstream model name is required.")
  .max(128, "Downstream model name must be 128 characters or fewer.")
  .refine((value) => !value.includes("/"), {
    message: "Do not include slashes; the provider prefix is added automatically.",
  });

const modelFieldsSchema = z.object({
  name: modelNameSchema,
  /** Downstream model segment (without provider prefix). */
  alias: modelAliasSuffixSchema,
  inputPrice: positivePriceSchema,
  outputPrice: positivePriceSchema,
  inputCachePrice: positivePriceSchema,
});

export const createModelInputSchema = modelFieldsSchema.extend({
  providerId: z.string().trim().min(1, "Provider is required."),
});

export const updateModelInputSchema = modelFieldsSchema.extend({
  id: z.string().trim().min(1, "Model id is required."),
});

/** Full downstream route: `{providerName}/{aliasSuffix}`. */
export function buildModelAlias(providerName: string, aliasSuffix: string) {
  const suffix = aliasSuffix.trim().replace(/^\/+/, "");
  return `${providerName}/${suffix}`;
}

/** Extract the segment after `{providerName}/` for edit forms. */
export function parseModelAliasSuffix(
  providerName: string,
  fullAlias: string,
): string {
  const prefix = `${providerName}/`;
  if (fullAlias.startsWith(prefix)) {
    return fullAlias.slice(prefix.length);
  }
  return fullAlias;
}

export const getModelsInputSchema = z.object({
  providerId: z.string().trim().min(1, "Provider is required."),
});

export type CreateModelInput = z.infer<typeof createModelInputSchema>;
export type UpdateModelInput = z.infer<typeof updateModelInputSchema>;
export type GetModelsInput = z.infer<typeof getModelsInputSchema>;

export type ModelListItem = {
  id: string;
  name: string;
  alias: string;
  inputPrice: number;
  outputPrice: number;
  inputCachePrice: number;
  providerId: string;
  createdAt: string;
  updatedAt: string;
};

export type ProviderSummary = {
  id: string;
  name: string;
  apiUrl: string;
  compatibilityType: "openai" | "anthropic";
  isActive: boolean;
};
