import type { JsonBody } from "./types/payload";

export function isRecord(value: unknown): value is JsonBody {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
