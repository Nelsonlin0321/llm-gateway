import type { ExtractedStreamEntry } from "./consumer/extract";
import type { NewEventLog, NewRequestLog } from "./db/schema";
import type { Db } from "./lib/db";
import {
  loadDeadRows,
  loadRows,
  toDeadLogRows,
  toDeadLogRowsFromFields,
} from "./load/index";
import { transformStreamFields } from "./transform/index";

/** Park and ACK when Redis delivery count exceeds this (failed more than 3 times). */
export const MAX_PROCESS_FAILURES = 3;

export type ProcessBatchResult = {
  /** Stream entry ids that were handled successfully and should be XACK'd. */
  idsToAck: string[];
  transformed: number;
  loaded: number;
  skippedMissingPayload: number;
  failed: number;
  /** Rows parked in dead_* tables (transform failure or deliveryCount > max). */
  parkedDeadLogs: number;
};

/**
 * Transform + load a batch of extracted stream entries.
 *
 * - Missing payload (deleted stream entry still in PEL) → ACK without write
 * - Transform validation failure → insert dead_* rows then ACK
 * - Load / unexpected failure with deliveryCount ≤ 3 → leave pending for reclaim
 * - Load / unexpected failure with deliveryCount > 3 → insert dead_* rows then ACK
 * - Success → include id for XACK
 */
export async function processExtractedEntries(
  db: Db,
  entries: ExtractedStreamEntry[],
): Promise<ProcessBatchResult> {
  const idsToAck: string[] = [];
  let transformed = 0;
  let loaded = 0;
  let skippedMissingPayload = 0;
  let failed = 0;
  let parkedDeadLogs = 0;

  for (const entry of entries) {
    let mapped:
      | { requestLog: NewRequestLog; eventLog: NewEventLog }
      | undefined;

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

      const result = transformStreamFields(entry.fields);
      if (!result.ok) {
        const parked = await parkDeadLogs(
          db,
          entry,
          undefined,
          result.reason,
        );
        if (parked === "parked") {
          parkedDeadLogs += 1;
          idsToAck.push(entry.id);
        } else {
          failed += 1;
        }
        continue;
      }
      mapped = {
        requestLog: result.requestLog,
        eventLog: result.eventLog,
      };
      transformed += 1;

      const loadResult = await loadRows(db, mapped);

      if (!loadResult.ok) {
        if ((entry.deliveryCount ?? 1) <= MAX_PROCESS_FAILURES) {
          failed += 1;
          console.error(
            "[gateway-ingest] load failed; leaving pending for reclaim",
            { id: entry.id, error: loadResult.error },
          );
          continue;
        }
        const parked = await parkDeadLogs(
          db,
          entry,
          mapped,
          formatError(loadResult.error),
        );
        if (parked === "parked") {
          parkedDeadLogs += 1;
          idsToAck.push(entry.id);
        } else {
          failed += 1;
        }
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
      if (mapped && (entry.deliveryCount ?? 1) <= MAX_PROCESS_FAILURES) {
        failed += 1;
        console.error(
          "[gateway-ingest] failed to process entry; leaving pending for reclaim",
          { id: entry.id, error },
        );
        continue;
      }
      const parked = await parkDeadLogs(
        db,
        entry,
        mapped,
        formatError(error),
      );
      if (parked === "parked") {
        parkedDeadLogs += 1;
        idsToAck.push(entry.id);
      } else {
        failed += 1;
      }
    }
  }

  return {
    idsToAck,
    transformed,
    loaded,
    skippedMissingPayload,
    failed,
    parkedDeadLogs,
  };
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

type ParkResult = "parked" | "pending";

/**
 * Insert dead_request_log + dead_event_log from mapped rows when present,
 * otherwise from raw stream fields. ACK only after a successful insert.
 */
async function parkDeadLogs(
  db: Db,
  entry: ExtractedStreamEntry,
  mapped: { requestLog: NewRequestLog; eventLog: NewEventLog } | undefined,
  failureReason: string,
): Promise<ParkResult> {
  const failureCount = entry.deliveryCount ?? 1;
  const deadRows = mapped
    ? toDeadLogRows({
        requestLog: mapped.requestLog,
        eventLog: mapped.eventLog,
        streamId: entry.id,
        failureReason,
        failureCount,
      })
    : toDeadLogRowsFromFields({
        fields: entry.fields,
        streamId: entry.id,
        failureReason,
        failureCount,
      });

  const result = await loadDeadRows(db, deadRows);
  if (!result.ok) {
    console.error(
      "[gateway-ingest] failed to park dead logs; leaving pending",
      { id: entry.id, error: result.error },
    );
    return "pending";
  }

  console.error(
    "[gateway-ingest] parked dead request/event log; will XACK",
    {
      id: entry.id,
      deliveryCount: failureCount,
      failureReason,
    },
  );
  return "parked";
}
