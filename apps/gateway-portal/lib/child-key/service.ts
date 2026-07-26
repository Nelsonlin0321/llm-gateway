import { randomUUID } from "node:crypto";

import type { ChildKey, Prisma } from "@/generated/prisma/client";
import {
  createChildKeyInputSchema,
  normalizeChildKeyTags,
  toggleChildKeyInputSchema,
  type ChildKeyListItem,
  type CreateChildKeyInput,
} from "@/lib/child-key/schema";
import {
  CHILD_KEY_PREFIX,
  signChildKeyToken,
} from "@/lib/child-key/jwt";

export { normalizeChildKeyTags };

type ChildKeyRecord = Pick<
  ChildKey,
  | "id"
  | "name"
  | "key"
  | "userEmail"
  | "tags"
  | "isActive"
  | "expiresAt"
  | "createdAt"
  | "updatedAt"
>;

export function validateCreateChildKeyInput(input: unknown) {
  return createChildKeyInputSchema.safeParse(input);
}

export function validateToggleChildKeyInput(input: unknown) {
  return toggleChildKeyInputSchema.safeParse(input);
}

export function maskChildKey(token: string): string {
  if (!token.startsWith(CHILD_KEY_PREFIX)) {
    return "sk_live_••••";
  }

  const body = token.slice(CHILD_KEY_PREFIX.length);
  if (body.length <= 8) {
    return `${CHILD_KEY_PREFIX}••••`;
  }

  return `${CHILD_KEY_PREFIX}${body.slice(0, 4)}…${body.slice(-4)}`;
}

export function toChildKeyListItem(record: ChildKeyRecord): ChildKeyListItem {
  return {
    id: record.id,
    name: record.name,
    userEmail: record.userEmail,
    tags: normalizeChildKeyTags(record.tags),
    isActive: record.isActive,
    expiresAt: record.expiresAt ? record.expiresAt.toISOString() : null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    keyPreview: maskChildKey(record.key),
  };
}

export async function buildChildKeyCreateData(
  input: CreateChildKeyInput,
  creator: { id: string; email: string },
) {
  const id = randomUUID();
  const now = new Date();
  const createdAt = now.toISOString();
  const tags = input.tags ?? {};

  const apiKey = await signChildKeyToken({
    key_id: id,
    name: input.name,
    policy_id: input.policyId,
    tags,
    user_email: input.userEmail,
    creator_email: creator.email,
    created_at: createdAt,
    updated_at: createdAt,
  });

  const data: Prisma.ChildKeyCreateInput = {
    id,
    name: input.name,
    key: apiKey,
    userEmail: input.userEmail,
    tags,
    isActive: true,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    creator: {
      connect: { id: creator.id },
    },
  };

  return { data, apiKey, id };
}
