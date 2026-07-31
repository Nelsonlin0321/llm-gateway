import type {
  RedisStreamClient,
  XReadGroupResult,
} from "../lib/redis-client.js";
import {
  extractStreamEntries,
  type ExtractedStreamEntry,
} from "./extract.js";

export type ReadGroupInput = {
  client: RedisStreamClient;
  streamKey: string;
  groupName: string;
  consumerName: string;
  /** COUNT — max entries this call returns (claims + new, shared budget). */
  count: number;
  /** BLOCK milliseconds. 0 or negative disables blocking. */
  blockMs: number;
  /**
   * CLAIM min-idle-time in milliseconds (Redis 8.4+).
   * Pending entries idle at least this long are reclaimed first.
   * Set to 0 or negative to omit CLAIM (older Redis compatibility).
   */
  claimMinIdleMs: number;
};

export type ReadGroupResult =
  | { ok: true; entries: ExtractedStreamEntry[]; raw: XReadGroupResult | null }
  | { ok: false; error: unknown };

/**
 * Build XREADGROUP argument list matching:
 *
 * ```
 * XREADGROUP GROUP mygroup consumer1 COUNT 100 BLOCK 2000 CLAIM 60000 STREAMS mystream >
 * ```
 */
export function buildXReadGroupArgs(input: {
  groupName: string;
  consumerName: string;
  count: number;
  blockMs: number;
  claimMinIdleMs: number;
  streamKey: string;
}): (string | number)[] {
  const args: (string | number)[] = [
    "GROUP",
    input.groupName,
    input.consumerName,
  ];

  if (input.count > 0) {
    args.push("COUNT", input.count);
  }

  if (input.blockMs > 0) {
    args.push("BLOCK", input.blockMs);
  }

  if (input.claimMinIdleMs > 0) {
    args.push("CLAIM", input.claimMinIdleMs);
  }

  args.push("STREAMS", input.streamKey, ">");
  return args;
}

/**
 * Read stream entries via consumer group.
 *
 * Equivalent Redis CLI:
 * `XREADGROUP GROUP <group> <consumer> COUNT <n> BLOCK <ms> CLAIM <ms> STREAMS <stream> >`
 *
 * Entries are extracted into structured records. This step does **not**
 * transform fields or write to Postgres, and does **not** XACK.
 */
export async function readGroupEntries(
  input: ReadGroupInput,
): Promise<ReadGroupResult> {
  const args = buildXReadGroupArgs({
    groupName: input.groupName,
    consumerName: input.consumerName,
    count: input.count,
    blockMs: input.blockMs,
    claimMinIdleMs: input.claimMinIdleMs,
    streamKey: input.streamKey,
  });

  try {
    const raw = await input.client.xreadgroup(...args);
    const entries = extractStreamEntries(raw);
    return { ok: true, entries, raw };
  } catch (error) {
    return { ok: false, error };
  }
}
