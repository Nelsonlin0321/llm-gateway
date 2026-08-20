const SENSITIVE_HEADERS = new Set([
  "authorization",
  "proxy-authorization",
  "x-api-key",
  "api-key",
  "set-cookie",
  "cookie",
]);

export function sanitizeHeaders(
  headers: Headers | Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};

  if (headers instanceof Headers) {
    for (const [key, value] of headers.entries()) {
      if (SENSITIVE_HEADERS.has(key.toLowerCase())) {
        continue;
      }
      out[key] = value;
    }
    return out;
  }

  for (const [key, value] of Object.entries(headers)) {
    if (SENSITIVE_HEADERS.has(key.toLowerCase())) {
      continue;
    }
    out[key] = value;
  }
  return out;
}

export function stringifyChildKeyTags(tags: unknown): string {
  if (tags !== null && typeof tags === "object" && !Array.isArray(tags)) {
    return JSON.stringify(tags);
  }
  return "{}";
}
