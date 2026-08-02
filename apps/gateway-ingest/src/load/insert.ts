import type { NewEventLog, NewRequestLog } from "../db/schema.js";
import { eventLog, requestLog } from "../db/schema.js";
import type { Db } from "../lib/db.js";
import {
  ensureDayPartitions,
  isMissingPartitionError,
  normalizeLogDate,
} from "./partitions.js";

export type LoadRowsInput = {
  requestLog: NewRequestLog;
  eventLog: NewEventLog;
};

export type LoadRowsResult =
  | { ok: true; createdPartition?: boolean }
  | { ok: false; error: unknown };

async function insertBoth(db: Db, input: LoadRowsInput): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.insert(requestLog).values(input.requestLog);
    await tx.insert(eventLog).values(input.eventLog);
  });
}

/**
 * Insert one request_log + event_log pair in a single transaction.
 *
 * Both tables are PARTITION BY RANGE (log_date). If Postgres reports that no
 * partition covers the row's log_date, create the daily partitions for both
 * parents and retry the insert once.
 */
export async function loadRows(
  db: Db,
  input: LoadRowsInput,
): Promise<LoadRowsResult> {
  try {
    await insertBoth(db, input);
    return { ok: true };
  } catch (error) {
    if (!isMissingPartitionError(error)) {
      return { ok: false, error };
    }

    const logDate =
      normalizeLogDate(input.requestLog.logDate) ??
      normalizeLogDate(input.eventLog.logDate);

    if (!logDate) {
      return {
        ok: false,
        error: new Error(
          `missing partition but could not normalize log_date: ${String(input.requestLog.logDate)}`,
        ),
      };
    }

    console.warn(
      "[gateway-ingest] missing partition for log_date; creating daily partitions and retrying",
      { logDate },
    );

    try {
      await ensureDayPartitions(db, logDate);
      await insertBoth(db, input);
      return { ok: true, createdPartition: true };
    } catch (retryError) {
      return { ok: false, error: retryError };
    }
  }
}
