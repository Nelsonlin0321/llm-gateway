import { loadConfig } from "./lib/config";
import { db } from "./lib/db";
import { createRedisClient } from "./lib/redis-client";
import {
  ackEntries,
  ensureConsumerGroup,
  readGroupEntries,
} from "./consumer/index";
import { processExtractedEntries } from "./process";

async function main(): Promise<void> {
  const config = loadConfig();
  const client = createRedisClient(config.redisUrl);

  if (!(process.env.DATABASE_URL ?? "").trim()) {
    console.error("[gateway-ingest] DATABASE_URL is required");
    client.disconnect();
    process.exit(1);
  }

  console.log("[gateway-ingest] starting", {
    stream: config.streamKey,
    group: config.groupName,
    consumer: config.consumerName,
    count: config.count,
    blockMs: config.blockMs,
    claimMinIdleMs: config.claimMinIdleMs,
    mode: "xautoclaim + xreadgroup → transform → load → xack",
  });

  const groupResult = await ensureConsumerGroup({
    client,
    streamKey: config.streamKey,
    groupName: config.groupName,
  });

  if (!groupResult.ok) {
    console.error(
      "[gateway-ingest] failed to ensure consumer group",
      groupResult.error,
    );
    client.disconnect();
    process.exit(1);
  }

  console.log("[gateway-ingest] consumer group ready", {
    group: config.groupName,
    created: groupResult.created,
  });

  let stopping = false;
  // Paginate XAUTOCLAIM through a large PEL instead of restarting at 0-0
  // every loop (which re-scans already-visited pending entries).
  let autoclaimStartId = "0-0";

  const shutdown = async (signal: string) => {
    if (stopping) {
      return;
    }
    stopping = true;
    console.log(`[gateway-ingest] received ${signal}, shutting down…`);
    try {
      await client.quit();
    } catch {
      client.disconnect();
    }
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });

  while (!stopping) {
    const result = await readGroupEntries({
      client,
      streamKey: config.streamKey,
      groupName: config.groupName,
      consumerName: config.consumerName,
      count: config.count,
      blockMs: config.blockMs,
      claimMinIdleMs: config.claimMinIdleMs,
      autoclaimStartId,
    });

    if (!result.ok) {
      console.error(`[gateway-ingest] ${result.stage} failed`, result.error);
      // Brief backoff so a Redis blip does not spin the CPU.
      await Bun.sleep(1000);
      continue;
    }

    autoclaimStartId = result.nextAutoclaimStartId;

    if (result.entries.length === 0) {
      // Block timed out with no messages — loop again.
      continue;
    }

    const batch = await processExtractedEntries(db, result.entries);

    const ackResult = await ackEntries({
      client,
      streamKey: config.streamKey,
      groupName: config.groupName,
      ids: batch.idsToAck,
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
      acked: ackResult.ok ? ackResult.acked : 0,
      ids: batch.idsToAck,
    });
  }
}

main().catch((error) => {
  console.error("[gateway-ingest] fatal", error);
  process.exit(1);
});
