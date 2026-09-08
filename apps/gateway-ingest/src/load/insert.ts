import type {
  NewDeadEventLog,
  NewDeadRequestLog,
  NewEventLog,
  NewRequestLog,
} from "../db/schema";
import {
  deadEventLog,
  deadRequestLog,
  eventLog,
  requestLog,
} from "../db/schema";
import type { Db } from "../lib/db";
import {
  parseBool,
  parseNullableString,
  parseOptionalString,
  parseTimestamp,
  toLogDate,
} from "../transform/parse";
import {
  ensureDayPartitions,
  isMissingPartitionError,
  normalizeLogDate,
} from "./partitions";

export type LoadRowsInput = {
  requestLog: NewRequestLog;
  eventLog: NewEventLog;
};

export type LoadRowsResult =
  | { ok: true; createdPartition?: boolean }
  | { ok: false; error: unknown; duplicate?: boolean };

export function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const code = (error as { code?: unknown }).code;
  return code === "23505";
}

async function insertBoth(db: Db, input: LoadRowsInput): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.insert(requestLog).values(input.requestLog).onConflictDoNothing();
    await tx.insert(eventLog).values(input.eventLog).onConflictDoNothing();
  });
}

/**
 * Insert one request_log + event_log pair in a single transaction.
 *
 * Both tables are PARTITION BY RANGE (log_date), with daily children
 * PARTITION BY LIST (organization_id). If Postgres reports that no partition
 * covers the row, create the day + org partitions for both parents and retry
 * the insert once.
 */
export async function loadRows(
  db: Db,
  input: LoadRowsInput,
): Promise<LoadRowsResult> {
  try {
    await insertBoth(db, input);
    return { ok: true };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: true };
    }
    if (!isMissingPartitionError(error)) {
      return { ok: false, error, duplicate: isUniqueViolation(error) };
    }

    const logDate =
      normalizeLogDate(input.requestLog.logDate) ??
      normalizeLogDate(input.eventLog.logDate);
    const organizationId =
      input.requestLog.organizationId || input.eventLog.organizationId;

    if (!logDate) {
      return {
        ok: false,
        error: new Error(
          `missing partition but could not normalize log_date: ${String(input.requestLog.logDate)}`,
        ),
      };
    }

    if (!organizationId) {
      return {
        ok: false,
        error: new Error(
          "missing partition but could not resolve organization_id",
        ),
      };
    }

    console.warn(
      "[gateway-ingest] missing partition; creating day + org partitions and retrying",
      { logDate, organizationId },
    );

    try {
      await ensureDayPartitions(db, logDate, organizationId);
      await insertBoth(db, input);
      return { ok: true, createdPartition: true };
    } catch (retryError) {
      if (isUniqueViolation(retryError)) {
        return { ok: true, createdPartition: true };
      }
      return { ok: false, error: retryError };
    }
  }
}

export type LoadDeadRowsInput = {
  requestLog: NewDeadRequestLog;
  eventLog: NewDeadEventLog;
};

export function toDeadLogRows(input: {
  requestLog: NewRequestLog;
  eventLog: NewEventLog;
  streamId: string;
  failureReason: string;
  failureCount: number;
}): LoadDeadRowsInput {
  const deadLetteredAt = new Date();
  return {
    requestLog: {
      eventId: input.requestLog.eventId,
      requestId: input.requestLog.requestId,
      logDate: input.requestLog.logDate,
      organizationId: input.requestLog.organizationId,
      requestPayloadJson: input.requestLog.requestPayloadJson,
      responseText: input.requestLog.responseText,
      streamId: input.streamId,
      failureReason: input.failureReason,
      failureCount: input.failureCount,
      deadLetteredAt,
    },
    eventLog: {
      eventId: input.eventLog.eventId,
      requestId: input.eventLog.requestId,
      logDate: input.eventLog.logDate,
      organizationId: input.eventLog.organizationId,
      streamId: input.streamId,
      failureReason: input.failureReason,
      failureCount: input.failureCount,
      deadLetteredAt,
    },
  };
}

/**
 * Build dead-log rows from raw stream fields when transform never produced
 * mapped rows. Missing identity fields fall back so the insert can still land.
 */
export function toDeadLogRowsFromFields(input: {
  fields: Record<string, string>;
  streamId: string;
  failureReason: string;
  failureCount: number;
}): LoadDeadRowsInput {
  const loggedAt = parseTimestamp(input.fields.logged_at) ?? new Date();
  const isStream = parseBool(input.fields.is_stream, false);
  const eventId =
    parseOptionalString(input.fields.event_id) ?? input.streamId;
  const requestId = parseOptionalString(input.fields.request_id) ?? "";
  const organizationId =
    parseOptionalString(input.fields.organization_id) ?? "";
  const logDate = toLogDate(loggedAt);
  const requestPayloadJson = parseNullableString(
    input.fields.request_payload_json,
  );
  const responseText = isStream
    ? parseNullableString(input.fields.response_stream_text)
    : parseNullableString(input.fields.response_payload_json);
  const deadLetteredAt = new Date();
  const identity = {
    eventId,
    requestId,
    logDate,
    organizationId,
    streamId: input.streamId,
    failureReason: input.failureReason,
    failureCount: input.failureCount,
    deadLetteredAt,
  };
  return {
    requestLog: {
      ...identity,
      requestPayloadJson,
      responseText,
    },
    eventLog: identity,
  };
}

/**
 * Insert one dead_request_log + dead_event_log pair.
 *
 * These tables are unpartitioned and have no FKs, so a poison live-table
 * insert (missing org, missing partition after retry, etc.) can still land.
 * Unique conflicts are treated as success so a later ACK retry is idempotent.
 */
export async function loadDeadRows(
  db: Db,
  input: LoadDeadRowsInput,
): Promise<LoadRowsResult> {
  try {
    await db.transaction(async (tx) => {
      await tx
        .insert(deadRequestLog)
        .values(input.requestLog)
        .onConflictDoNothing();
      await tx
        .insert(deadEventLog)
        .values(input.eventLog)
        .onConflictDoNothing();
    });
    return { ok: true };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: true };
    }
    return { ok: false, error };
  }
}
