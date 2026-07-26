import type { MiddlewareHandler } from "hono";

import { authenticateChildApiKey } from "./service.js";
import type { ChildKeyJwtPayload } from "./types.js";

export type ChildKeyAuthVariables = {
  childKey: ChildKeyJwtPayload;
  childApiKey: string;
};

/**
 * Require a valid **plain** child API key on proxy routes.
 *
 * Clients must send: `Authorization: Bearer sk_<jwt>`
 * (the secret returned by the portal — never the encrypted DB value).
 *
 * Sets `childKey` (verified JWT payload) and `childApiKey` (plain `sk_…`) on context.
 */
export const requireChildKeyAuth: MiddlewareHandler<{
  Variables: ChildKeyAuthVariables;
}> = async (c, next) => {
  const result = await authenticateChildApiKey(c.req.header("authorization"));

  if (!result.ok) {
    return c.json({ error: result.error }, result.status);
  }

  c.set("childKey", result.payload);
  c.set("childApiKey", result.plainApiKey);
  await next();
};
