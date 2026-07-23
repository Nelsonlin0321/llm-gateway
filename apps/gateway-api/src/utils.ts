import type { JsonBody } from "./types/payload.js";

export function isRecord(value: unknown): value is JsonBody {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
