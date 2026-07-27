import { decodeJwt, jwtVerify, SignJWT, type JWTPayload } from "jose";

import { type ChildKeyJwtPayload } from "@/lib/child-key/schema";

export const CHILD_KEY_PREFIX = "sk_";

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

export function unixTimestampSeconds(date: Date = new Date()): number {
  return Math.floor(date.getTime() / 1000);
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

  return {
    key_id: payload.key_id,
    name: payload.name,
    policy_id:
      typeof payload.policy_id === "string" && payload.policy_id.length > 0
        ? payload.policy_id
        : undefined,
    issued_at: parseIssuedAt(payload),
    exp:
      typeof payload.exp === "number" && Number.isFinite(payload.exp)
        ? Math.trunc(payload.exp)
        : undefined,
  };
}

/** Sign a child-key JWT and return `sk_<jwt>`. */
export async function signChildKeyToken(
  payload: ChildKeyJwtPayload,
): Promise<string> {
  const issuedAt = Math.trunc(payload.issued_at);

  const claims: Record<string, unknown> = {
    key_id: payload.key_id,
    name: payload.name,
    issued_at: issuedAt,
  };

  if (payload.policy_id) {
    claims.policy_id = payload.policy_id;
  }

  let signer = new SignJWT(claims).setProtectedHeader({
    alg: "HS256",
    typ: "JWT",
  });

  if (
    typeof payload.exp === "number" &&
    Number.isFinite(payload.exp) &&
    payload.exp > issuedAt
  ) {
    signer = signer.setExpirationTime(Math.trunc(payload.exp));
  }

  const jwt = await signer.sign(getJwtSigningSecret());

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
