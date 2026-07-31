import "dotenv/config";
import { applyPayloadCapture, sanitizeHeaders } from "../request-log/index.js";
import type { CaptureLevel } from "../request-log/index.js";

export type CurlCommandInput = {
  url: string;
  method: string;
  headers: Headers;
  body: string | undefined;
  captureLevel: CaptureLevel;
};

function bashSingleQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function sanitizeHeadersForCurl(headers: Headers): Array<[string, string]> {
  const sanitized = sanitizeHeaders(headers);
  const entries = Object.entries(sanitized).filter(([key]) => {
    const lowered = key.toLowerCase();
    return lowered !== "cookie" && lowered !== "set-cookie";
  });

  entries.sort(([a], [b]) => a.toLowerCase().localeCompare(b.toLowerCase()));
  return entries;
}

export function buildCurlCommand(input: CurlCommandInput): string {
  const parts: string[] = [
    "curl",
    "-X",
    bashSingleQuote(input.method.toUpperCase()),
    bashSingleQuote(input.url),
  ];

  // for (const [key, value] of sanitizeHeadersForCurl(input.headers)) {
  //   parts.push("-H", bashSingleQuote(`${key}: ${value}`));
  // }

  for (const [key, value] of input.headers) {
    parts.push("-H", bashSingleQuote(`${key}: ${value}`));
  }

  const body = applyPayloadCapture(input.body, input.captureLevel);
  if (body) {
    parts.push("--data-raw", bashSingleQuote(body));
  }

  return parts.join(" ");
}

export function isUpstreamCurlLogEnabled(): boolean {
  return String(process.env.UPSTREAM_CURL_LOG ?? "").trim() === "1";
}
