import type { XReadGroupResult } from "../lib/redis-client.js";

/**
 * One Redis Stream entry after extraction.
 * Fields are the flat key/value pairs from XADD (all strings).
 */
export type ExtractedStreamEntry = {
  /** Stream key the entry was read from. */
  stream: string;
  /** Redis stream entry id (e.g. `1710000000000-0`). */
  id: string;
  /** Flat field map as published by the producer. */
  fields: Record<string, string>;
};

/**
 * Convert Redis alternating field/value array into a plain object.
 * Last value wins if a field is repeated.
 */
export function fieldsArrayToRecord(fields: string[]): Record<string, string> {
  const record: Record<string, string> = {};
  for (let i = 0; i + 1 < fields.length; i += 2) {
    const key = fields[i];
    const value = fields[i + 1];
    if (key === undefined || value === undefined) {
      continue;
    }
    record[key] = value;
  }
  return record;
}

/**
 * Parse a raw XREADGROUP reply into extracted stream entries.
 * Returns an empty array when Redis replies with null (timeout / no messages).
 */
export function extractStreamEntries(
  reply: XReadGroupResult | null | undefined,
): ExtractedStreamEntry[] {
  if (!reply || reply.length === 0) {
    return [];
  }

  const extracted: ExtractedStreamEntry[] = [];

  for (const streamResult of reply) {
    if (!Array.isArray(streamResult) || streamResult.length < 2) {
      continue;
    }

    const [streamKey, entries] = streamResult;
    if (typeof streamKey !== "string" || !Array.isArray(entries)) {
      continue;
    }

    for (const entry of entries) {
      if (!Array.isArray(entry) || entry.length < 2) {
        continue;
      }
      const [id, fields] = entry;
      if (typeof id !== "string" || !Array.isArray(fields)) {
        continue;
      }
      extracted.push({
        stream: streamKey,
        id,
        fields: fieldsArrayToRecord(fields),
      });
    }
  }

  return extracted;
}
