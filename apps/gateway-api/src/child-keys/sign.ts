import { SignJWT } from "jose";

import { CHILD_KEY_PREFIX, withChildKeyPrefix } from "./jwt.js";
import type { ChildKeyJwtPayload } from "./types.js";

function getJwtSigningSecret(): Uint8Array {
  const secret = process.env.JWT_SIGNING_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SIGNING_SECRET is not configured. Add it to the environment before signing child API keys.",
    );
  }

  return new TextEncoder().encode(secret);
}

/** Sign a child-key JWT (`sk_<jwt>`). Used by tests and local tooling. */
export async function signChildKeyToken(
  payload: ChildKeyJwtPayload,
): Promise<string> {
  const issuedAt = Math.trunc(payload.issued_at);

  const claims: Record<string, unknown> = {
    key_id: payload.key_id,
    name: payload.name,
    tags: payload.tags ?? {},
    user_email: payload.user_email,
    creator_email: payload.creator_email,
    issued_at: issuedAt,
  };

  if (payload.policy_id) {
    claims.policy_id = payload.policy_id;
  }

  let signer = new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(payload.key_id)
    .setIssuedAt(issuedAt);

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

export { CHILD_KEY_PREFIX };
