import { decodeJwt, jwtVerify, SignJWT, type JWTPayload } from "jose";

import {
  normalizeChildKeyTags,
  type ChildKeyJwtPayload,
} from "@/lib/child-key/schema";

export const CHILD_KEY_PREFIX = "sk_live_";

function getJwtSigningSecret(): Uint8Array {
  const secret = process.env.JWT_SIGNING_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SIGNING_SECRET is not configured. Add it to the environment before managing child API keys.",
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
  if (
    typeof payload.created_at !== "string" ||
    typeof payload.updated_at !== "string"
  ) {
    throw new Error("Child key token payload is missing timestamps.");
  }

  return {
    key_id: payload.key_id,
    name: payload.name,
    policy_id:
      typeof payload.policy_id === "string" && payload.policy_id.length > 0
        ? payload.policy_id
        : undefined,
    tags: normalizeChildKeyTags(payload.tags),
    user_email: payload.user_email,
    creator_email: payload.creator_email,
    created_at: payload.created_at,
    updated_at: payload.updated_at,
  };
}

/** Sign a child-key JWT and return `sk_live_<jwt>`. */
export async function signChildKeyToken(
  payload: ChildKeyJwtPayload,
): Promise<string> {
  const claims: Record<string, unknown> = {
    key_id: payload.key_id,
    name: payload.name,
    tags: payload.tags ?? {},
    user_email: payload.user_email,
    creator_email: payload.creator_email,
    created_at: payload.created_at,
    updated_at: payload.updated_at,
  };

  if (payload.policy_id) {
    claims.policy_id = payload.policy_id;
  }

  const jwt = await new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(payload.key_id)
    .setIssuedAt()
    .sign(getJwtSigningSecret());

  return withChildKeyPrefix(jwt);
}

/** Verify signature with JWT_SIGNING_SECRET and return the typed payload. */
export async function verifyChildKeyToken(
  token: string,
): Promise<ChildKeyJwtPayload> {
  const jwt = stripChildKeyPrefix(token);
  const { payload } = await jwtVerify(jwt, getJwtSigningSecret(), {
    algorithms: ["HS256"],
  });
  return parseChildKeyJwtPayload(payload);
}

/**
 * Decode the JWT payload without verifying the signature.
 * Prefer `verifyChildKeyToken` when authenticity matters.
 */
export function decodeChildKeyToken(token: string): ChildKeyJwtPayload {
  const jwt = stripChildKeyPrefix(token);
  return parseChildKeyJwtPayload(decodeJwt(jwt));
}
