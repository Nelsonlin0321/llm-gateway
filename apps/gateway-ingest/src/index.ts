import { loadConfig } from "./lib/config.js";
import { createRedisClient } from "./lib/redis-client.js";
import {
  ackEntries,
  ensureConsumerGroup,
  readGroupEntries,
  type ExtractedStreamEntry,
} from "./consumer/index.js";

/**
 * Log a single extracted Redis stream entry (no transform / no DB write).
 */
function logExtractedEntry(entry: ExtractedStreamEntry): void {
  const summary = {
    stream: entry.stream,
    id: entry.id,
    source: entry.source,
    payload_missing: entry.payloadMissing === true,
    schema_version: entry.fields.schema_version,
    event_type: entry.fields.event_type,
    event_id: entry.fields.event_id,
    request_id: entry.fields.request_id,
    provider: entry.fields.provider,
    requested_model_alias: entry.fields.requested_model_alias,
    status_code: entry.fields.status_code,
    field_count: Object.keys(entry.fields).length,
  };

  console.log("[gateway-ingest] extracted stream entry", summary);
  // Full field map at debug level so large payloads stay optional.
  if (process.env.REQUEST_LOG_DEBUG === "1") {
    console.log("[gateway-ingest] entry fields", entry.fields);
  }
}

/**
 * Phase A handle step: extract (already done) + log.
 * Returns entry ids that were handled successfully and should be XACK'd.
 */
function handleExtractedEntries(entries: ExtractedStreamEntry[]): string[] {
  const ackedIds: string[] = [];

  for (const entry of entries) {
    try {
      if (entry.payloadMissing) {
        console.warn(
          "[gateway-ingest] pending entry has null payload (deleted from stream); will XACK",
          { stream: entry.stream, id: entry.id, source: entry.source },
        );
      }
      logExtractedEntry(entry);
      ackedIds.push(entry.id);
    } catch (error) {
      console.error(
        "[gateway-ingest] failed to handle entry; leaving pending for reclaim",
        { id: entry.id, error },
      );
    }
  }

  return ackedIds;
}

async function main(): Promise<void> {
  const config = loadConfig();
  const client = createRedisClient(config.redisUrl);

  console.log("[gateway-ingest] starting", {
    stream: config.streamKey,
    group: config.groupName,
    consumer: config.consumerName,
    count: config.count,
    blockMs: config.blockMs,
    claimMinIdleMs: config.claimMinIdleMs,
    mode: "xautoclaim + xreadgroup (Redis 6.2+ / 8.2 compatible)",
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
      console.error(
        `[gateway-ingest] ${result.stage} failed`,
        result.error,
      );
      // Brief backoff so a Redis blip does not spin the CPU.
      await Bun.sleep(1000);
      continue;
    }

    autoclaimStartId = result.nextAutoclaimStartId;

    if (result.entries.length === 0) {
      // Block timed out with no messages — loop again.
      continue;
    }

    const idsToAck = handleExtractedEntries(result.entries);

    const ackResult = await ackEntries({
      client,
      streamKey: config.streamKey,
      groupName: config.groupName,
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
      acked: ackResult.ok ? ackResult.acked : 0,
      ids: idsToAck,
    });
  }
}

main().catch((error) => {
  console.error("[gateway-ingest] fatal", error);
  process.exit(1);
});
