import type { ExtractedStreamEntry } from "./consumer/extract";
import type { Db } from "./lib/db";
import { loadRows } from "./load/index";
import { transformStreamFields } from "./transform/index";

export type DeadLetterEntry = {
  id: string;
  fields: Record<string, string>;
  reason: string;
};

export type ProcessBatchResult = {
  /** Stream entry ids that were handled successfully and should be XACK'd. */
  idsToAck: string[];
  /** Unrecoverable payloads to park on the DLQ before ACK. */
  deadLetters: DeadLetterEntry[];
  transformed: number;
  loaded: number;
  skippedMissingPayload: number;
  failed: number;
};

/**
 * Transform + load a batch of extracted stream entries.
 *
 * - Missing payload (deleted stream entry still in PEL) → ACK without write
 * - Transform or load failure → leave pending for reclaim (no ACK)
 * - Success → include id for XACK
 */
export async function processExtractedEntries(
  db: Db,
  entries: ExtractedStreamEntry[],
): Promise<ProcessBatchResult> {
  const idsToAck: string[] = [];
  const deadLetters: DeadLetterEntry[] = [];
  let transformed = 0;
  let loaded = 0;
  let skippedMissingPayload = 0;
  let failed = 0;

  for (const entry of entries) {
    try {
      if (entry.payloadMissing) {
        console.warn(
          "[gateway-ingest] pending entry has null payload (deleted from stream); will XACK",
          { stream: entry.stream, id: entry.id, source: entry.source },
        );
        skippedMissingPayload += 1;
        idsToAck.push(entry.id);
        continue;
      }

      const mapped = transformStreamFields(entry.fields);
      if (!mapped.ok) {
        console.error(
          "[gateway-ingest] transform failed; moving to dead-letter stream",
          { id: entry.id, reason: mapped.reason },
        );
        deadLetters.push({
          id: entry.id,
          fields: entry.fields,
          reason: mapped.reason,
        });
        continue;
      }
      transformed += 1;

      const loadResult = await loadRows(db, {
        requestLog: mapped.requestLog,
        eventLog: mapped.eventLog,
      });

      if (!loadResult.ok) {
        failed += 1;
        console.error(
          "[gateway-ingest] load failed; leaving pending for reclaim",
          { id: entry.id, error: loadResult.error },
        );
        continue;
      }

      loaded += 1;
      idsToAck.push(entry.id);

      if (process.env.REQUEST_LOG_DEBUG === "1") {
        console.log("[gateway-ingest] loaded entry", {
          id: entry.id,
          eventId: mapped.eventLog.eventId,
          requestId: mapped.eventLog.requestId,
          inputToken: mapped.eventLog.inputToken,
          outputToken: mapped.eventLog.outputToken,
          cachedInputToken: mapped.eventLog.cachedInputToken,
          totalToken: mapped.eventLog.totalToken,
          cost: mapped.eventLog.cost,
        });
      }
    } catch (error) {
      failed += 1;
      console.error(
        "[gateway-ingest] failed to process entry; leaving pending for reclaim",
        { id: entry.id, error },
      );
    }
  }

  return {
    idsToAck,
    deadLetters,
    transformed,
    loaded,
    skippedMissingPayload,
    failed,
  };
}
