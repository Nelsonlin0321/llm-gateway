import type { NewEventLog, NewRequestLog } from "../db/schema.js";
import { eventLog, requestLog } from "../db/schema.js";
import type { Db } from "../lib/db.js";

export type LoadRowsInput = {
  requestLog: NewRequestLog;
  eventLog: NewEventLog;
};

export type LoadRowsResult =
  | { ok: true }
  | { ok: false; error: unknown };

/**
 * Insert one request_log + event_log pair in a single transaction.
 * Both succeed or neither is committed.
 */
export async function loadRows(
  db: Db,
  input: LoadRowsInput,
): Promise<LoadRowsResult> {
  try {
    await db.transaction(async (tx) => {
      await tx.insert(requestLog).values(input.requestLog);
      await tx.insert(eventLog).values(input.eventLog);
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}
