import type { ExtractedStreamEntry } from "./consumer/extract";
import { ackEntries, readGroupEntries } from "./consumer/index";
import type { IngestConfig } from "./lib/config";
import type { Db } from "./lib/db";
import { createIdleExitTracker } from "./lib/idle-exit";
import type { RedisStreamClient } from "./lib/redis-client";
import { REQUEST_LOG_DLQ_STREAM } from "./lib/redis-keys";
import {
  processExtractedEntries,
  type ProcessBatchResult,
} from "./process";

export type ProcessEntriesFn = (
  db: Db,
  entries: ExtractedStreamEntry[],
) => Promise<ProcessBatchResult>;

export type ConsumeLoopResult = "idle-exit" | "stopped" | "max-duration";

export type ConsumeLoopInput = {
  config: IngestConfig;
  client: RedisStreamClient;
  db: Db;
  isStopping: () => boolean;
  processEntries?: ProcessEntriesFn;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
};

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Drain the stream until idle-exit, max duration, a stop signal, or
 * (when idle-exit is disabled) forever.
 *
 * The idle timer starts at loop entry and resets whenever a non-empty
 * batch is read or finished. Empty reads do not reset it.
 *
 * A non-blocking empty read (`blockMs <= 0`) ends the drain when
 * idle-exit is enabled — the scheduled Worker has no more work this tick.
 */
export async function runConsumeLoop(
  input: ConsumeLoopInput,
): Promise<ConsumeLoopResult> {
  const processEntries = input.processEntries ?? processExtractedEntries;
  const now = input.now ?? Date.now;
  const sleep = input.sleep ?? defaultSleep;
  const idle = createIdleExitTracker(input.config.idleExitMs, now);
  const startedAt = now();
  let autoclaimStartId = "0-0";

  while (!input.isStopping()) {
    if (
      input.config.maxDurationMs > 0 &&
      now() - startedAt >= input.config.maxDurationMs
    ) {
      return "max-duration";
    }

    if (idle.isExpired()) {
      return "idle-exit";
    }

    const result = await readGroupEntries({
      client: input.client,
      streamKey: input.config.streamKey,
      groupName: input.config.groupName,
      consumerName: input.config.consumerName,
      count: input.config.count,
      blockMs: idle.capBlockMs(input.config.blockMs),
      claimMinIdleMs: input.config.claimMinIdleMs,
      autoclaimStartId,
    });

    if (input.isStopping()) {
      return "stopped";
    }

    if (!result.ok) {
      console.error(`[gateway-ingest] ${result.stage} failed`, result.error);
      // Brief backoff so a Redis blip does not spin the CPU.
      await sleep(1000);
      continue;
    }

    autoclaimStartId = result.nextAutoclaimStartId;

    if (result.entries.length === 0) {
      // Upstash REST cannot BLOCK. An empty non-blocking read means the
      // stream has no currently available work for this invocation.
      if (input.config.blockMs <= 0) {
        if (input.config.idleExitMs > 0) {
          return "idle-exit";
        }
        await sleep(1000);
      }
      continue;
    }

    idle.reset();

    const batch = await processEntries(input.db, result.entries);

    const deadLetterIds: string[] = [];
    for (const dead of batch.deadLetters) {
      try {
        await input.client.xadd(
          REQUEST_LOG_DLQ_STREAM,
          "*",
          "source_id",
          dead.id,
          "reason",
          dead.reason,
          "payload_json",
          JSON.stringify(dead.fields),
        );
        deadLetterIds.push(dead.id);
      } catch (error) {
        console.error(
          "[gateway-ingest] failed to write dead-letter; leaving pending",
          { id: dead.id, error },
        );
      }
    }

    const idsToAck = [...batch.idsToAck, ...deadLetterIds];
    const ackResult = await ackEntries({
      client: input.client,
      streamKey: input.config.streamKey,
      groupName: input.config.groupName,
      ids: idsToAck,
    });

    if (!ackResult.ok) {
      console.error(
        "[gateway-ingest] XACK failed; entries may be reclaimed later",
        ackResult.error,
      );
    }

    console.log("[gateway-ingest] batch handled", {
      total: result.entries.length,
      claimed: result.claimedCount,
      new: result.newCount,
      transformed: batch.transformed,
      loaded: batch.loaded,
      skippedMissingPayload: batch.skippedMissingPayload,
      failed: batch.failed,
      deadLettered: deadLetterIds.length,
      acked: ackResult.ok ? ackResult.acked : 0,
      ids: idsToAck,
    });

    // Idle clock starts after the last ingested work, not when the batch
    // was first read (processing can outlast idleExitMs).
    idle.reset();
  }

  return "stopped";
}
