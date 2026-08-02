import type {
  XAutoClaimResult,
  XReadGroupResult,
} from "../lib/redis-client.js";

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
  /**
   * True when Redis returned a null payload (entry deleted from stream
   * but still present in the consumer group PEL).
   */
  payloadMissing?: boolean;
  /** How this entry was obtained. */
  source?: "autoclaim" | "xreadgroup";
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

function entryFromRaw(
  stream: string,
  id: string,
  fields: string[] | null,
  source: ExtractedStreamEntry["source"],
): ExtractedStreamEntry {
  if (fields === null) {
    return {
      stream,
      id,
      fields: {},
      payloadMissing: true,
      source,
    };
  }
  return {
    stream,
    id,
    fields: fieldsArrayToRecord(fields),
    source,
  };
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
      if (typeof id !== "string") {
        continue;
      }
      if (fields !== null && !Array.isArray(fields)) {
        continue;
      }
      extracted.push(
        entryFromRaw(streamKey, id, fields, "xreadgroup"),
      );
    }
  }

  return extracted;
}

/**
 * Parse a raw XAUTOCLAIM reply into extracted entries + next scan cursor.
 * Pass `nextStartId` as the next call's start id so large PELs are not
 * re-scanned from `0-0` every loop.
 */
export function extractAutoclaimEntries(
  streamKey: string,
  reply: XAutoClaimResult | null | undefined,
): { nextStartId: string; entries: ExtractedStreamEntry[] } {
  if (!reply || !Array.isArray(reply) || reply.length < 2) {
    return { nextStartId: "0-0", entries: [] };
  }

  const nextStartId =
    typeof reply[0] === "string" && reply[0].length > 0 ? reply[0] : "0-0";
  const rawEntries = reply[1];
  const entries: ExtractedStreamEntry[] = [];

  if (!Array.isArray(rawEntries)) {
    return { nextStartId, entries };
  }

  for (const entry of rawEntries) {
    if (!Array.isArray(entry) || entry.length < 2) {
      continue;
    }
    const [id, fields] = entry;
    if (typeof id !== "string") {
      continue;
    }
    if (fields !== null && !Array.isArray(fields)) {
      continue;
    }
    entries.push(entryFromRaw(streamKey, id, fields, "autoclaim"));
  }

  return { nextStartId, entries };
}
