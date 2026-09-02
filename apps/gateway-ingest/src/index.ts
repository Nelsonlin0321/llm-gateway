import { loadConfig } from "./lib/config";
import { db } from "./lib/db";
import { createRedisClient } from "./lib/redis-client";
import { ensureConsumerGroup } from "./consumer/index";
import { runConsumeLoop } from "./consume-loop";

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
    idleExitMs: config.idleExitMs,
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

  const shutdown = async (reason: string) => {
    if (stopping) {
      return;
    }
    stopping = true;
    console.log(`[gateway-ingest] ${reason}, shutting down…`);
    try {
      await client.quit();
    } catch {
      client.disconnect();
    }
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown("received SIGINT");
  });
  process.on("SIGTERM", () => {
    void shutdown("received SIGTERM");
  });

  const result = await runConsumeLoop({
    config,
    client,
    db,
    isStopping: () => stopping,
  });

  if (stopping || result === "stopped") {
    return;
  }

  await shutdown(`idle for ${config.idleExitMs}ms with no events to ingest`);
}

main().catch((error) => {
  console.error("[gateway-ingest] fatal", error);
  process.exit(1);
});
