import type { Prisma } from "@/generated/prisma/client";

import type { ChildKeyListItem } from "@/lib/child-key/schema";
import { toChildKeyListItem } from "@/lib/child-key/service";

export type ChildKeyActionResult =
  | {
      ok: true;
      childKey: ChildKeyListItem;
      message: string;
      /** Present only immediately after create or rotate. */
      apiKey?: string;
    }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

export const childKeySelect = {
  id: true,
  name: true,
  key: true,
  creatorId: true,
  userEmail: true,
  tags: true,
  isActive: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ChildKeySelect;

export function childKeyValidationError(
  error: string,
  fieldErrors?: Record<string, string[] | undefined>,
): ChildKeyActionResult {
  return {
    ok: false,
    error,
    fieldErrors,
  };
}

export function childKeySuccess(
  record: Parameters<typeof toChildKeyListItem>[0],
  message: string,
  apiKey?: string,
): ChildKeyActionResult {
  return {
    ok: true,
    childKey: toChildKeyListItem(record),
    message,
    ...(apiKey ? { apiKey } : {}),
  };
}
