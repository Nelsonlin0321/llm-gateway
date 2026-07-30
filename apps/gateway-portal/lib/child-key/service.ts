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
  unixTimestampSeconds,
} from "@/lib/child-key/jwt";
import {
  decryptApiKeyForProxy,
  encryptApiKey,
} from "@/lib/llm-provider/crypto";

export { normalizeChildKeyTags };

/** Existing row fields needed to re-issue a rotated secret. */
export type ChildKeyRotateSource = {
  id: string;
  name: string;
  creatorId: string;
  userEmail: string;
  tags: unknown;
  expiresAt: Date | null;
  /** Previous issuedAt (seconds) — new value must be strictly greater. */
  issuedAt: number;
  key: string;
};

type ChildKeyRecord = Pick<
  ChildKey,
  | "id"
  | "name"
  | "creatorId"
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

/** Encrypt a plaintext `sk_…` API key for database storage. */
export function encryptChildKey(plainApiKey: string): string {
  if (!plainApiKey.startsWith(CHILD_KEY_PREFIX)) {
    throw new Error(
      `Child API keys must start with ${CHILD_KEY_PREFIX} before encryption.`,
    );
  }

  return encryptApiKey(plainApiKey);
}

/**
 * Decrypt a stored child-key ciphertext with API_ENCRYPT_KEY.
 * Database rows are always encrypted; plaintext is never persisted.
 */
export function decryptChildKey(stored: string): string {
  const plain = decryptApiKeyForProxy(stored);

  if (!plain.startsWith(CHILD_KEY_PREFIX)) {
    throw new Error(
      `Decrypted child API key is invalid; expected prefix ${CHILD_KEY_PREFIX}.`,
    );
  }

  return plain;
}

export function maskChildKey(token: string): string {
  if (!token.startsWith(CHILD_KEY_PREFIX)) {
    return `${CHILD_KEY_PREFIX}••••`;
  }

  const body = token.slice(CHILD_KEY_PREFIX.length);
  if (body.length <= 8) {
    return `${CHILD_KEY_PREFIX}••••`;
  }

  return `${CHILD_KEY_PREFIX}${body.slice(0, 4)}…${body.slice(-4)}`;
}

export function toChildKeyListItem(record: ChildKeyRecord): ChildKeyListItem {
  let keyPreview = `${CHILD_KEY_PREFIX}••••`;

  try {
    keyPreview = maskChildKey(decryptChildKey(record.key));
  } catch {
    // Keep a generic preview if decryption fails (misconfigured secret, etc.).
  }

  return {
    id: record.id,
    name: record.name,
    userEmail: record.userEmail,
    tags: normalizeChildKeyTags(record.tags),
    isActive: record.isActive,
    expiresAt: record.expiresAt ? record.expiresAt.toISOString() : null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    keyPreview,
  };
}

export async function buildChildKeyCreateData(
  input: CreateChildKeyInput,
  creator: { id: string },
) {
  const id = randomUUID();
  const tags = input.tags ?? {};
  const issuedAt = unixTimestampSeconds();

  const expiresAtDate = input.expiresAt ? new Date(input.expiresAt) : null;
  const exp =
    expiresAtDate && !Number.isNaN(expiresAtDate.getTime())
      ? Math.floor(expiresAtDate.getTime() / 1000)
      : undefined;

  const apiKey = await signChildKeyToken({
    key_id: id,
    name: input.name,
    creator_id: creator.id,
    issued_at: issuedAt,
    exp,
  });

  const data: Prisma.ChildKeyCreateInput = {
    id,
    name: input.name,
    // Persist only the encrypted secret — never plaintext in the database.
    key: encryptChildKey(apiKey),
    userEmail: input.userEmail,
    tags,
    isActive: true,
    expiresAt: expiresAtDate,
    issuedAt,
    creator: {
      connect: { id: creator.id },
    },
  };

  return { data, apiKey, id };
}

/**
 * Build Prisma update payload + new plaintext secret for key rotation.
 *
 * Keeps `id` (key_id) stable for analytics. Preserves name and expiresAt,
 * issues a new JWT with a new `issued_at`, encrypts it, and overwrites the
 * stored ciphertext so the previous secret can no longer be revealed.
 */
export async function buildChildKeyRotateData(record: ChildKeyRotateSource) {
  // Ensure issuedAt advances even if rotation happens within the same second.
  const issuedAt = Math.max(unixTimestampSeconds(), record.issuedAt + 1);

  const exp =
    record.expiresAt && !Number.isNaN(record.expiresAt.getTime())
      ? Math.floor(record.expiresAt.getTime() / 1000)
      : undefined;

  const apiKey = await signChildKeyToken({
    key_id: record.id,
    name: record.name,
    creator_id: record.creatorId,
    issued_at: issuedAt,
    exp,
  });

  const data: Prisma.ChildKeyUpdateInput = {
    key: encryptChildKey(apiKey),
    issuedAt,
  };

  return { data, apiKey, issuedAt };
}
