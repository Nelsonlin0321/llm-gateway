import { timingSafeEqual } from "node:crypto";

import prisma from "../prisma.js";
import { decryptChildKey } from "./service.js";
import type { ChildKeyAuthFailure, ChildKeyJwtPayload } from "./types.js";

export type ChildKeyDbRecord = {
  id: string;
  key: string;
  isActive: boolean;
  expiresAt: Date | null;
  issuedAt: number;
};

export type ChildKeyLookup = {
  findById(id: string): Promise<ChildKeyDbRecord | null>;
};

export type ChildKeyAuthzSuccess = {
  ok: true;
  record: ChildKeyDbRecord;
};

export type ChildKeyAuthzResult = ChildKeyAuthzSuccess | ChildKeyAuthFailure;

const defaultLookup: ChildKeyLookup = {
  async findById(id: string) {
    return prisma.childKey.findUnique({
      where: { id },
      select: {
        id: true,
        key: true,
        isActive: true,
        expiresAt: true,
        issuedAt: true,
      },
    });
  },
};

function authzFailure(
  status: 401 | 503,
  message: string,
  type: ChildKeyAuthFailure["error"]["type"] = "authentication_error",
): ChildKeyAuthFailure {
  return {
    ok: false,
    status,
    error: { message, type },
  };
}

function secretsEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

/**
 * Authorize a JWT-verified child key against the Prisma `ChildKey` row.
 *
 * Checks:
 * 1. Row exists for `payload.key_id`
 * 2. `isActive === true`
 * 3. `expiresAt` is null or in the future
 * 4. `issuedAt` matches JWT `issued_at` (invalidates rotated tokens)
 * 5. Presented plain key matches decrypt(DB ciphertext)
 *
 * DB failures fail closed with HTTP 503.
 */
export async function authorizeChildKey(
  plainApiKey: string,
  payload: ChildKeyJwtPayload,
  lookup: ChildKeyLookup = defaultLookup,
): Promise<ChildKeyAuthzResult> {
  let record: ChildKeyDbRecord | null;

  try {
    record = await lookup.findById(payload.key_id);
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "database unavailable";
    return authzFailure(
      503,
      `Unable to authorize API key (database error): ${detail}`,
      "server_error",
    );
  }

  if (!record) {
    return authzFailure(401, "API key not found or has been revoked.");
  }

  if (!record.isActive) {
    return authzFailure(401, "API key is deactivated.");
  }

  if (record.expiresAt && record.expiresAt.getTime() <= Date.now()) {
    return authzFailure(401, "API key has expired.");
  }

  if (record.issuedAt !== payload.issued_at) {
    return authzFailure(
      401,
      "API key has been rotated or is no longer valid.",
    );
  }

  try {
    const storedPlain = decryptChildKey(record.key);
    if (!secretsEqual(storedPlain, plainApiKey)) {
      return authzFailure(401, "API key does not match the issued secret.");
    }
  } catch {
    return authzFailure(401, "API key secret could not be verified.");
  }

  return { ok: true, record };
}
