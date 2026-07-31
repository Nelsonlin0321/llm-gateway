import { loadConfig } from "./lib/config.js";
import { createRedisClient } from "./lib/redis-client.js";
import {
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
    });

    if (!result.ok) {
      console.error("[gateway-ingest] XREADGROUP failed", result.error);
      // Brief backoff so a Redis blip does not spin the CPU.
      await Bun.sleep(1000);
      continue;
    }

    if (result.entries.length === 0) {
      // Block timed out with no messages — loop again.
      continue;
    }

    for (const entry of result.entries) {
      logExtractedEntry(entry);
    }

    // Intentionally no XACK yet: extract-only phase keeps entries pending
    // until transform + Postgres ingest is implemented. CLAIM will reclaim
    // idle pending messages after REQUEST_LOG_CLAIM_MIN_IDLE_MS.
    console.log("[gateway-ingest] batch extracted", {
      count: result.entries.length,
      ids: result.entries.map((e) => e.id),
    });
  }
}

main().catch((error) => {
  console.error("[gateway-ingest] fatal", error);
  process.exit(1);
});
