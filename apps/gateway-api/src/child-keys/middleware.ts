import type { MiddlewareHandler } from "hono";

import { authenticateChildApiKey } from "./service.js";
import type { ChildKeyDbRecord } from "./types.js";

export type ChildKeyAuthVariables = {
  childKeyRecord: ChildKeyDbRecord;
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
  Variables: ChildKeyAuthVariables & Record<string, unknown>;
}> = async (c, next) => {
  const result = await authenticateChildApiKey(c.req.header("Authorization"));

  if (!result.ok) {
    return c.json({ error: result.error }, result.status as 401 | 403 | 503);
  }
  c.set("childKeyRecord", result.record);
  await next();
};
