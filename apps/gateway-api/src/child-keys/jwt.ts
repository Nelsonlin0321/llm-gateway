import { decodeJwt, jwtVerify, type JWTPayload } from "jose";

import type { ChildKeyJwtPayload, ChildKeyTags } from "./types.js";

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

function normalizeTags(value: unknown): ChildKeyTags {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const tags: ChildKeyTags = {};
  for (const [rawKey, rawValue] of Object.entries(
    value as Record<string, unknown>,
  )) {
    const key = rawKey.trim();
    if (!key || typeof rawValue !== "string") {
      continue;
    }
    const trimmed = rawValue.trim();
    if (trimmed) {
      tags[key] = trimmed;
    }
  }
  return tags;
}

function parseIssuedAt(payload: JWTPayload): number {
  if (
    typeof payload.issued_at === "number" &&
    Number.isFinite(payload.issued_at)
  ) {
    return Math.trunc(payload.issued_at);
  }

  if (typeof payload.iat === "number" && Number.isFinite(payload.iat)) {
    return Math.trunc(payload.iat);
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
    typeof payload.user_email !== "string" ||
    payload.user_email.length === 0
  ) {
    throw new Error("Child key token payload is missing user_email.");
  }
  if (
    typeof payload.creator_email !== "string" ||
    payload.creator_email.length === 0
  ) {
    throw new Error("Child key token payload is missing creator_email.");
  }

  return {
    key_id: payload.key_id,
    name: payload.name,
    policy_id:
      typeof payload.policy_id === "string" && payload.policy_id.length > 0
        ? payload.policy_id
        : undefined,
    tags: normalizeTags(payload.tags),
    user_email: payload.user_email,
    creator_email: payload.creator_email,
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
