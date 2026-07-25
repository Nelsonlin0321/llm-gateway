import type { Prisma } from "@/generated/prisma/client";

import { toProviderListItem } from "@/lib/llm-provider/service";

export type ProviderActionResult =
  | {
      ok: true;
      provider: ReturnType<typeof toProviderListItem>;
      message: string;
    }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

export const providerSelect = {
  id: true,
  name: true,
  apiUrl: true,
  encryptedApiKey: true,
  compatibilityType: true,
  inputPrice: true,
  inputCachePrice: true,
  outputPrice: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.LLMProviderSelect;

export function validationErrorResult(
  error: string,
  fieldErrors?: Record<string, string[] | undefined>,
): ProviderActionResult {
  return {
    ok: false,
    error,
    fieldErrors,
  };
}
