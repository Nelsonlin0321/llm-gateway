import { ensureConsumerGroup } from "./consumer/index";
import {
  runConsumeLoop,
  type ConsumeLoopInput,
  type ConsumeLoopResult,
} from "./consume-loop";

export type IngestJobInput = ConsumeLoopInput;

export type IngestJobResult = ConsumeLoopResult;

/**
 * One ingest invocation: ensure the consumer group, then drain available
 * stream entries until idle-exit, max duration, or stop.
 *
 * Scheduling between invocations is the Cloudflare Cron Trigger
 * (`scheduled()` in `src/index.ts`).
 */
export async function runIngestJob(
  input: IngestJobInput,
): Promise<IngestJobResult> {
  const groupResult = await ensureConsumerGroup({
    client: input.client,
    streamKey: input.config.streamKey,
    groupName: input.config.groupName,
  });

  if (!groupResult.ok) {
    console.error(
      "[gateway-ingest] failed to ensure consumer group",
      groupResult.error,
    );
    const error = groupResult.error;
    throw error instanceof Error
      ? error
      : new Error("failed to ensure consumer group");
  }

  console.log("[gateway-ingest] consumer group ready", {
    group: input.config.groupName,
    created: groupResult.created,
  });

  return runConsumeLoop(input);
}
