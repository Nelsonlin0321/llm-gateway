import { randomUUID } from "node:crypto";
import type { MiddlewareHandler } from "hono";

export const REQUEST_ID_HEADER = "x-request-id";

export type RequestIdVariables = {
  requestId: string;
};

/**
 * Ensure every request has a correlation id on Hono context and response.
 * Reuses an inbound `x-request-id` when present; otherwise generates a UUID.
 */
export const requestIdMiddleware: MiddlewareHandler<{
  Variables: RequestIdVariables & Record<string, unknown>;
}> = async (c, next) => {
  const incoming = c.req.header(REQUEST_ID_HEADER)?.trim();
  const requestId =
    incoming && incoming.length > 0 ? incoming : randomUUID();
  c.set("requestId", requestId);
  await next();
  c.header(REQUEST_ID_HEADER, requestId);
};

export function getOrCreateRequestId(
  existing: string | undefined | null,
): string {
  const trimmed = existing?.trim();
  if (trimmed && trimmed.length > 0) {
    return trimmed;
  }
  return randomUUID();
}
