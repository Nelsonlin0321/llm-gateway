import type { RedisStreamClient } from "../lib/redis-client.js";

export type EnsureGroupInput = {
  client: RedisStreamClient;
  streamKey: string;
  groupName: string;
  /**
   * Start id for the group. `"0"` reads from the beginning of the stream;
   * `"$"` only new messages after group creation.
   * Default: `"0"` so existing buffered logs are consumable.
   */
  startId?: string;
};

export type EnsureGroupResult =
  | { ok: true; created: boolean }
  | { ok: false; error: unknown };

/**
 * Ensure a consumer group exists on the stream.
 * Uses `XGROUP CREATE ... MKSTREAM` so the stream is created if missing.
 * Treats BUSYGROUP (group already exists) as success.
 */
export async function ensureConsumerGroup(
  input: EnsureGroupInput,
): Promise<EnsureGroupResult> {
  const startId = input.startId ?? "0";

  try {
    await input.client.xgroup(
      "CREATE",
      input.streamKey,
      input.groupName,
      startId,
      "MKSTREAM",
    );
    return { ok: true, created: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("BUSYGROUP")) {
      return { ok: true, created: false };
    }
    return { ok: false, error };
  }
}
