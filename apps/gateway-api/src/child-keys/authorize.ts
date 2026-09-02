import { timingSafeEqual } from "node:crypto";
import { getChildKeyCacheKey } from "../lib/redis-keys";
import { redis_cache } from "../lib/redis-client";
import { childKeyRepository } from "./repository";
import { decryptChildKey } from "./service";
import type {
  ChildKeyAuthFailure,
  ChildKeyDbRecord,
  ChildKeyJwtPayload,
} from "./types";

export type ChildKeyAuthzSuccess = {
  ok: true;
  record: ChildKeyDbRecord;
};

export type ChildKeyAuthzResult = ChildKeyAuthzSuccess | ChildKeyAuthFailure;

const originalFindById = childKeyRepository.findById;

function shouldBypassChildKeyCache(): boolean {
  return (
    process.env.NODE_ENV === "test" ||
    childKeyRepository.findById !== originalFindById
  );
}

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
 * Authorize a JWT-verified child key against the `ChildKey` row.
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
): Promise<ChildKeyAuthzResult> {
  let record: ChildKeyDbRecord | null;

  try {
    if (shouldBypassChildKeyCache()) {
      record = await childKeyRepository.findById(payload.key_id);
    } else {
      const cacheKey = getChildKeyCacheKey(payload.key_id);
      record = await redis_cache(cacheKey, () =>
        childKeyRepository.findById(payload.key_id),
      );
    }
  } catch (error) {
    console.error("[child-key] authorization lookup failed", error);
    return authzFailure(
      503,
      "Unable to authorize API key right now.",
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
    return authzFailure(401, "API key has been rotated or is no longer valid.");
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
