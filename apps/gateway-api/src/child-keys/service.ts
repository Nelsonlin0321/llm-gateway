import { authorizeChildKey } from "./authorize.js";
import { decryptApiKeyForProxy } from "./crypto.js";
import { CHILD_KEY_PREFIX, verifyChildKeyToken } from "./jwt.js";
import type { ChildKeyAuthResult, ChildKeyJwtPayload } from "./types.js";

export { decryptApiKeyForProxy } from "./crypto.js";
export { encryptApiKey } from "./crypto.js";
export { authorizeChildKey, type ChildKeyAuthzResult } from "./authorize.js";
export {
  CHILD_KEY_PREFIX,
  decodeChildKeyToken,
  verifyChildKeyToken,
} from "./jwt.js";
export type {
  ChildKeyAuthFailure,
  ChildKeyAuthResult,
  ChildKeyAuthSuccess,
  ChildKeyJwtPayload,
} from "./types.js";

/**
 * Decrypt a **database-stored** child-key ciphertext to the plain `sk_…` API key.
 *
 * This is the same AES-256-GCM scheme as the portal (`API_ENCRYPT_KEY`).
 * It is **not** used for the Authorization Bearer value — clients present the
 * plain `sk_…` key, while only the DB holds ciphertext.
 */
export function decryptChildKey(storedCiphertext: string): string {
  const plain = decryptApiKeyForProxy(storedCiphertext);

  if (!plain.startsWith(CHILD_KEY_PREFIX)) {
    throw new Error(
      `Decrypted child API key is invalid; expected prefix ${CHILD_KEY_PREFIX}.`,
    );
  }

  return plain;
}

/**
 * Validate that a Bearer token is the plain child API key (`sk_…`).
 * Encrypted DB forms must not be used as the Authorization secret.
 */
export function requirePlainChildApiKey(childApiKey: string): string {
  const trimmed = childApiKey.trim();

  if (!trimmed) {
    throw new Error("Child API key is empty.");
  }

  if (!trimmed.startsWith(CHILD_KEY_PREFIX)) {
    throw new Error(
      `Child API key must be the plain secret starting with ${CHILD_KEY_PREFIX}.`,
    );
  }

  return trimmed;
}

export function extractBearerToken(
  authorizationHeader: string | undefined | null,
): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) {
    return null;
  }

  const token = match[1].trim();
  return token.length > 0 ? token : null;
}

/**
 * Authenticate a gateway proxy request.
 *
 * **Client contract**
 * - Header: `Authorization: Bearer <plain_child_api_key>`
 * - Plain key format: `sk_<jwt>` (what the portal shows on create/reveal)
 *
 * **Storage**
 * - Database stores only the AES-encrypted form of that plain key
 * - Use `decryptChildKey` / `decryptApiKeyForProxy` when reading from DB
 *
 * **Proxy steps**
 * 1. Require Bearer plain `sk_…` key
 * 2. Verify JWT signature and claims with `JWT_SIGNING_SECRET` → payload
 * 3. Reject expired JWT (`exp` claim)
 * 4. Authorize against `ChildKey` row (active, expiresAt, issuedAt, secret match)
 */
export async function authenticateChildApiKey(
  authorizationHeader: string | undefined | null,
): Promise<ChildKeyAuthResult> {
  const bearer = extractBearerToken(authorizationHeader);

  if (!bearer) {
    return {
      ok: false,
      status: 401,
      error: {
        message:
          "Missing or invalid Authorization header. Use: Authorization: Bearer <your_api_key>",
        type: "authentication_error",
      },
    };
  }

  let plainApiKey: string;
  try {
    plainApiKey = requirePlainChildApiKey(bearer);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid API key.";
    return {
      ok: false,
      status: 401,
      error: {
        message,
        type: "authentication_error",
      },
    };
  }

  let payload: ChildKeyJwtPayload;
  try {
    // Verify JWT and decode claims (key_id, name, creator_id, issued_at, exp).
    payload = await verifyChildKeyToken(plainApiKey);

    if (
      typeof payload.exp === "number" &&
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return {
        ok: false,
        status: 401,
        error: {
          message: "API key has expired.",
          type: "authentication_error",
        },
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid API key.";
    const expired =
      /expir/i.test(message) ||
      (error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code?: string }).code === "ERR_JWT_EXPIRED");

    if (!expired) {
      console.error("[child-key] JWT verification failed", error);
    }
    return {
      ok: false,
      status: 401,
      error: {
        message: expired ? "API key has expired." : "Invalid API key.",
        type: "authentication_error",
      },
    };
  }

  const authz = await authorizeChildKey(plainApiKey, payload);

  if (!authz.ok) {
    return authz;
  }

  return {
    ok: true,
    record: authz.record,
  };
}
