import type { RedisStreamClient } from "../lib/redis-client";

export type AckEntriesInput = {
  client: RedisStreamClient;
  streamKey: string;
  groupName: string;
  ids: string[];
};

export type AckEntriesResult =
  | { ok: true; acked: number }
  | { ok: false; error: unknown };

/**
 * Acknowledge stream entries after successful handling.
 *
 * ```
 * XACK mystream mygroup id1 id2 …
 * ```
 *
 * No-ops with `{ ok: true, acked: 0 }` when `ids` is empty.
 */
export async function ackEntries(
  input: AckEntriesInput,
): Promise<AckEntriesResult> {
  if (input.ids.length === 0) {
    return { ok: true, acked: 0 };
  }

  try {
    const acked = await input.client.xack(
      input.streamKey,
      input.groupName,
      ...input.ids,
    );
    return { ok: true, acked };
  } catch (error) {
    return { ok: false, error };
  }
}
