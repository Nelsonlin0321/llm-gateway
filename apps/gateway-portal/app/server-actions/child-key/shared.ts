import { revalidatePath } from "next/cache";

import { childKeys, type ChildKey } from "@/lib/db";
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

export type ChildKeySelect = Pick<
  ChildKey,
  | "id"
  | "name"
  | "key"
  | "creatorId"
  | "userEmail"
  | "tags"
  | "isActive"
  | "expiresAt"
  | "createdAt"
  | "updatedAt"
>;

export const childKeyReturning = {
  id: childKeys.id,
  name: childKeys.name,
  key: childKeys.key,
  creatorId: childKeys.creatorId,
  userEmail: childKeys.userEmail,
  tags: childKeys.tags,
  isActive: childKeys.isActive,
  expiresAt: childKeys.expiresAt,
  createdAt: childKeys.createdAt,
  updatedAt: childKeys.updatedAt,
};

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

export function revalidateOrganizationChildKeyPaths(organizationId: string) {
  revalidatePath(`/org/${organizationId}/child-keys`);
  revalidatePath(`/org/${organizationId}`);
}
