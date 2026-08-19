import { decodeJwt, jwtVerify, type JWTPayload } from "jose";

import type { ChildKeyJwtPayload } from "./types.js";

export const CHILD_KEY_PREFIX = "sk_";

function getJwtSigningSecret(): Uint8Array {
  const secret = process.env.JWT_SIGNING_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SIGNING_SECRET is not configured. Add it to the environment before verifying child API keys.",
    );
  }

  return new TextEncoder().encode(secret);
}

export function stripChildKeyPrefix(token: string): string {
  if (token.startsWith(CHILD_KEY_PREFIX)) {
    return token.slice(CHILD_KEY_PREFIX.length);
  }
  return token;
}

export function withChildKeyPrefix(jwt: string): string {
  if (jwt.startsWith(CHILD_KEY_PREFIX)) {
    return jwt;
  }
  return `${CHILD_KEY_PREFIX}${jwt}`;
}

function parseIssuedAt(payload: JWTPayload): number {
  if (
    typeof payload.issued_at === "number" &&
    Number.isFinite(payload.issued_at)
  ) {
    return Math.trunc(payload.issued_at);
  }

  throw new Error("Child key token payload is missing issued_at.");
}

export function parseChildKeyJwtPayload(
  payload: JWTPayload,
): ChildKeyJwtPayload {
  if (typeof payload.key_id !== "string" || payload.key_id.length === 0) {
    throw new Error("Child key token payload is missing key_id.");
  }
  if (typeof payload.name !== "string" || payload.name.length === 0) {
    throw new Error("Child key token payload is missing name.");
  }
  if (
    typeof payload.creator_id !== "string" ||
    payload.creator_id.length === 0
  ) {
    throw new Error("Child key token payload is missing creator_id.");
  }

  return {
    key_id: payload.key_id,
    issued_at: parseIssuedAt(payload),
    exp:
      typeof payload.exp === "number" && Number.isFinite(payload.exp)
        ? Math.trunc(payload.exp)
        : undefined,
  };
}

/**
 * Verify signature with JWT_SIGNING_SECRET and return typed claims.
 * Rejects expired tokens when the JWT includes a standard `exp` claim.
 */
export async function verifyChildKeyToken(
  token: string,
): Promise<ChildKeyJwtPayload> {
  const jwt = stripChildKeyPrefix(token);
  const { payload } = await jwtVerify(jwt, getJwtSigningSecret(), {
    algorithms: ["HS256"],
  });
  return parseChildKeyJwtPayload(payload);
}

/** Decode JWT claims without verifying the signature (tests / debugging). */
export function decodeChildKeyToken(token: string): ChildKeyJwtPayload {
  const jwt = stripChildKeyPrefix(token);
  return parseChildKeyJwtPayload(decodeJwt(jwt));
}
