import { SignJWT } from "jose";

import { CHILD_KEY_PREFIX } from "../../src/child-keys/jwt";
import type { ChildKeyJwtPayload } from "../../src/child-keys/types";

/**
 * Mint a plain `sk_…` child API key for tests only.
 * Production key issuance lives in gateway-portal, not gateway-api.
 */
export async function mintTestChildApiKey(
  payload: ChildKeyJwtPayload,
): Promise<string> {
  const secret = process.env.JWT_SIGNING_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SIGNING_SECRET is not configured. Set it to mint test child API keys.",
    );
  }

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

  const jwt = await signer.sign(new TextEncoder().encode(secret));
  return `${CHILD_KEY_PREFIX}${jwt}`;
}
