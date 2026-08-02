/**
 * Small parsers for Redis stream string fields → typed values.
 */

export function parseOptionalString(
  value: string | undefined,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Empty / missing → null (for optional FK and nullable text columns). */
export function parseNullableString(
  value: string | undefined,
): string | null {
  const parsed = parseOptionalString(value);
  return parsed === undefined ? null : parsed;
}

export function parseBool(value: string | undefined, fallback = false): boolean {
  if (value === undefined) {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") {
    return true;
  }
  if (normalized === "false" || normalized === "0") {
    return false;
  }
  return fallback;
}

export function parseIntField(
  value: string | undefined,
): number | null {
  if (value === undefined || value.trim() === "") {
    return null;
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return null;
  }
  return Math.trunc(n);
}

export function parseFloatField(
  value: string | undefined,
  fallback = 0,
): number {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function parseTimestamp(value: string | undefined): Date | null {
  if (!value || value.trim() === "") {
    return null;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** YYYY-MM-DD for `date` columns (UTC). */
export function toLogDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function parseJsonObject<T extends Record<string, unknown>>(
  value: string | undefined,
): T | null {
  if (!value || value.trim() === "") {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed != null && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as T;
    }
    return null;
  } catch {
    return null;
  }
}

export function parseApiFamily(
  value: string | undefined,
): "openai" | "anthropic" | null {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "openai" || v === "anthropic") {
    return v;
  }
  return null;
}
