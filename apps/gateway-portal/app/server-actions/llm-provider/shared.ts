import { llmProviders, type LLMProvider } from "@/lib/db";
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

/** Fields selected for provider list/action responses. */
export type ProviderSelect = Pick<
  LLMProvider,
  | "id"
  | "name"
  | "apiUrl"
  | "encryptedApiKey"
  | "compatibilityType"
  | "isActive"
  | "createdAt"
  | "updatedAt"
>;

export const providerReturning = {
  id: llmProviders.id,
  name: llmProviders.name,
  apiUrl: llmProviders.apiUrl,
  encryptedApiKey: llmProviders.encryptedApiKey,
  compatibilityType: llmProviders.compatibilityType,
  isActive: llmProviders.isActive,
  createdAt: llmProviders.createdAt,
  updatedAt: llmProviders.updatedAt,
};

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
