import type { Prisma } from "@/generated/prisma/client";

import { toModelListItem } from "@/lib/model/service";

export type ModelActionResult =
  | {
      ok: true;
      model: ReturnType<typeof toModelListItem>;
      message: string;
    }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

export const modelSelect = {
  id: true,
  name: true,
  alias: true,
  inputPrice: true,
  outputPrice: true,
  inputCachePrice: true,
  providerId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ModelSelect;

export function modelValidationError(
  error: string,
  fieldErrors?: Record<string, string[] | undefined>,
): ModelActionResult {
  return {
    ok: false,
    error,
    fieldErrors,
  };
}
