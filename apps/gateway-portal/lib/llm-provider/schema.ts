import { z } from "zod";

export const compatibilityTypes = ["openai", "anthropic"] as const;

export const providerNamePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const apiUrlSchema = z
  .string()
  .trim()
  .url("Enter a valid API URL.")
  .refine((value) => /^https?:\/\//.test(value), {
    message: "API URL must start with http:// or https://.",
  })
  .transform((value) => value.replace(/\/+$/, ""));

const baseProviderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Provider name must be at least 2 characters.")
    .max(32, "Provider name must be 32 characters or fewer.")
    .transform((value) => value.toLowerCase())
    .refine((value) => providerNamePattern.test(value), {
      message:
        "Use lowercase letters, numbers, and single hyphens only so model routing stays stable.",
    }),
  apiUrl: apiUrlSchema,
  compatibilityType: z.enum(compatibilityTypes, {
    error: "Choose a supported compatibility type.",
  }),
  isActive: z.coerce.boolean().default(true),
});

export const createProviderInputSchema = baseProviderSchema.extend({
  apiKey: z.string().trim().min(1, "API key is required."),
});

export const updateProviderInputSchema = baseProviderSchema.extend({
  id: z.string().trim().min(1, "Provider id is required."),
  apiKey: z.preprocess((value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  }, z.string().min(1, "API key cannot be empty.").optional()),
});

export const getProvidersOptionsSchema = z
  .object({
    includeInactive: z.coerce.boolean().optional(),
  })
  .optional();

export type CompatibilityType = (typeof compatibilityTypes)[number];
export type CreateProviderInput = z.infer<typeof createProviderInputSchema>;
export type UpdateProviderInput = z.infer<typeof updateProviderInputSchema>;
export type GetProvidersOptions = z.infer<typeof getProvidersOptionsSchema>;

export type ProviderListItem = {
  id: string;
  name: string;
  apiUrl: string;
  compatibilityType: CompatibilityType;
  isActive: boolean;
  hasStoredApiKey: boolean;
  createdAt: string;
  updatedAt: string;
};
