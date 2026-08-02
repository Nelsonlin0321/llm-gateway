import type {
  RedisStreamClient,
  XAutoClaimResult,
  XReadGroupResult,
} from "../lib/redis-client.js";
import {
  extractAutoclaimEntries,
  extractStreamEntries,
  type ExtractedStreamEntry,
} from "./extract.js";

/** Initial / wrap-around XAUTOCLAIM scan cursor. */
export const XAUTOCLAIM_START_ID = "0-0";

export type ReadGroupInput = {
  client: RedisStreamClient;
  streamKey: string;
  groupName: string;
  consumerName: string;
  /**
   * Shared COUNT budget: idle pending (XAUTOCLAIM) first, then new
   * messages (XREADGROUP >) fill the remainder.
   */
  count: number;
  /** BLOCK milliseconds for the new-message read. 0 = do not block. */
  blockMs: number;
  /**
   * XAUTOCLAIM min-idle-time in milliseconds.
   * Pending entries idle at least this long are reclaimed first.
   * Set to 0 or negative to skip reclaim (new messages only).
   */
  claimMinIdleMs: number;
  /**
   * XAUTOCLAIM PEL scan cursor. Pass the previous result's
   * `nextAutoclaimStartId` (start with `"0-0"`). Avoids re-scanning a
   * large PEL from the beginning on every loop.
   */
  autoclaimStartId?: string;
};

export type ReadGroupResult =
  | {
      ok: true;
      entries: ExtractedStreamEntry[];
      /** Entries from XAUTOCLAIM. */
      claimedCount: number;
      /** Entries from XREADGROUP `>`. */
      newCount: number;
      /**
       * Cursor for the next XAUTOCLAIM call. Redis returns `"0-0"` when
       * a full PEL scan has completed (wrap around).
       */
      nextAutoclaimStartId: string;
    }
  | { ok: false; error: unknown; stage: "xautoclaim" | "xreadgroup" };

/**
 * Build classic XREADGROUP args (no CLAIM — Redis 8.2 compatible):
 *
 * ```
 * XREADGROUP GROUP mygroup consumer1 COUNT 10 BLOCK 2000 STREAMS mystream >
 * ```
 */
export function buildXReadGroupArgs(input: {
  groupName: string;
  consumerName: string;
  count: number;
  blockMs: number;
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
    args.push("BLOCK", input.blockMs); // if blockMs > 0, then use BLOCK otherwise non-blocking
  }

  args.push("STREAMS", input.streamKey, ">");
  return args;
}

/**
 * Build XAUTOCLAIM args (Redis 6.2+):
 *
 * ```
 * XAUTOCLAIM mystream mygroup consumer1 60000 <startId> COUNT 10
 * ```
 */
export function buildXAutoClaimArgs(input: {
  streamKey: string;
  groupName: string;
  consumerName: string;
  claimMinIdleMs: number;
  startId: string;
  count: number;
}): (string | number)[] {
  const args: (string | number)[] = [
    input.streamKey,
    input.groupName,
    input.consumerName,
    input.claimMinIdleMs,
    input.startId,
  ];
  if (input.count > 0) {
    args.push("COUNT", input.count);
  }
  return args;
}

/**
 * Read stream entries via consumer group for Redis 8.2+:
 *
 * 1. `XAUTOCLAIM … <cursor> COUNT n` — reclaim idle pending (paginated PEL scan)
 * 2. `XREADGROUP … >` — fill remaining budget with never-delivered messages
 *
 * Maintain `nextAutoclaimStartId` across loops so a large PEL is scanned
 * incrementally instead of restarting at `0-0` every iteration (latency).
 * When Redis returns next id `0-0`, the scan has wrapped and the next
 * call starts from the beginning again.
 *
 * When claim returned nothing, the new-message read uses `BLOCK`.
 * When claim returned some entries, the new-message read is non-blocking.
 *
 * Caller should `XACK` after successful extract handling.
 */
export async function readGroupEntries(
  input: ReadGroupInput,
): Promise<ReadGroupResult> {
  const budget = input.count; // input_count is already positive
  const entries: ExtractedStreamEntry[] = [];
  let nextAutoclaimStartId = input.autoclaimStartId ?? XAUTOCLAIM_START_ID;
  let claimedCount = 0;

  // --- 1) Reclaim idle pending first (paginated via start cursor) ---
  if (input.claimMinIdleMs > 0) {
    const claimArgs = buildXAutoClaimArgs({
      streamKey: input.streamKey,
      groupName: input.groupName,
      consumerName: input.consumerName,
      claimMinIdleMs: input.claimMinIdleMs,
      startId: nextAutoclaimStartId,
      count: budget,
    });

    let claimRaw: XAutoClaimResult;
    try {
      claimRaw = await input.client.xautoclaim(...claimArgs);
    } catch (error) {
      return { ok: false, error, stage: "xautoclaim" };
    }

    const claimed = extractAutoclaimEntries(input.streamKey, claimRaw);
    nextAutoclaimStartId = claimed.nextStartId;
    entries.push(...claimed.entries);
    claimedCount = claimed.entries.length;
  }

  const remaining = budget > 0 ? Math.max(0, budget - entries.length) : 0;

  // --- 2) Fill remaining budget with new messages ---
  // Skip when budget is already full. When we already have claimed work,
  // avoid blocking so extract/ack can proceed promptly.
  if (remaining > 0 || entries.length === 0) {
    const newCount =
      remaining > 0 ? remaining : input.count > 0 ? input.count : 10;
    const blockMs = entries.length === 0 ? input.blockMs : 0; // Wait blockMs milliseconds only when not pending messages to be processed
    // if blockMs < 0, build x read group agrs without blocking to intermediate return

    const readArgs = buildXReadGroupArgs({
      groupName: input.groupName,
      consumerName: input.consumerName,
      count: newCount,
      blockMs: blockMs,
      streamKey: input.streamKey,
    });

    let readRaw: XReadGroupResult | null;
    try {
      readRaw = await input.client.xreadgroup(...readArgs);
    } catch (error) {
      return { ok: false, error, stage: "xreadgroup" };
    }

    const fresh = extractStreamEntries(readRaw);
    entries.push(...fresh);

    return {
      ok: true,
      entries,
      claimedCount,
      newCount: fresh.length,
      nextAutoclaimStartId,
    };
  }

  return {
    ok: true,
    entries,
    claimedCount,
    newCount: 0,
    nextAutoclaimStartId,
  };
}
