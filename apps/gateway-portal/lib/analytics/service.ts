import { and, eq, sql, type SQL } from "drizzle-orm";

import { db, eventLog } from "@/lib/db";

import { buildSegmentColorMap } from "./colors";
import { humanizeKey } from "./format";
import {
  BUILTIN_DIMENSION_LABELS,
  BUILTIN_DIMENSIONS,
  DIMENSION_KEY_PATTERN,
  isBuiltinDimension,
  USER_EMAIL_FILTER_KEY,
  type AnalyticsDateRange,
  type AnalyticsDimensionOption,
  type AnalyticsFilterOption,
  type AnalyticsMetaResult,
  type AnalyticsMetric,
  type AnalyticsQuery,
  type AnalyticsSegmentSummary,
  type AnalyticsSeriesPoint,
  type AnalyticsSeriesResult,
  type AnalyticsTotals,
  type DatePreset,
} from "./schema";

const UNKNOWN_SEGMENT = "(none)";

/** UTC YYYY-MM-DD for a Date. */
function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Add `days` to a YYYY-MM-DD string (UTC calendar). */
function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
}

function eachDateInclusive(from: string, to: string): string[] {
  const dates: string[] = [];
  let cursor = from;
  while (cursor <= to) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return dates;
}

/**
 * Resolve inclusive date range from preset / custom inputs.
 * Uses "today" UTC unless `anchorDate` is provided (useful when latest log is older).
 */
export function resolveDateRange(
  query: Pick<AnalyticsQuery, "datePreset" | "from" | "to">,
  anchorDate?: string | null,
): AnalyticsDateRange {
  const today = toIsoDate(new Date());
  const end = anchorDate && anchorDate < today ? anchorDate : today;

  if (query.datePreset === "custom" && query.from && query.to) {
    return { from: query.from, to: query.to, preset: "custom" };
  }

  const days = query.datePreset === "30d" ? 30 : 7;
  return {
    from: addDays(end, -(days - 1)),
    to: end,
    preset: query.datePreset as DatePreset,
  };
}

/**
 * Expression for the stacked-segment dimension value.
 * Dynamic keys read metadata first, then child-key tags (seed data stores env/team in tags).
 *
 * IMPORTANT: reuse the same SQL fragment instance in SELECT and GROUP BY so
 * Postgres sees one expression (separate parameter slots break GROUP BY).
 */
function dimensionSqlFragment(dimension: string): SQL {
  if (dimension === "provider") {
    return sql`${eventLog.provider}`;
  }
  if (dimension === "requestedModel") {
    return sql`${eventLog.requestedModel}`;
  }
  if (dimension === "user_name") {
    return sql`${eventLog.userEmail}`;
  }

  // Dynamic key — already validated by DIMENSION_KEY_PATTERN.
  // Literal key (validated) avoids dual parameter slots in SELECT vs GROUP BY.
  const safeKey = dimension;
  return sql`coalesce(
    nullif(${eventLog.metadataJson} ->> ${safeKey}, ''),
    nullif(${eventLog.childKeyTagsJson} ->> ${safeKey}, ''),
    ${UNKNOWN_SEGMENT}
  )`;
}

/**
 * Build AND filters for metadata/tag equality (and userEmail → user_email).
 * Multiple values for one key are OR'd; keys are AND'd.
 */
function buildFilterClauses(
  filters: Record<string, string[]>,
): SQL | undefined {
  const clauses: SQL[] = [];

  for (const [rawKey, rawValues] of Object.entries(filters)) {
    if (!DIMENSION_KEY_PATTERN.test(rawKey)) continue;
    const values = rawValues
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
      .slice(0, 50);
    if (values.length === 0) continue;

    // Canonical + legacy keys for event_log.user_email
    if (
      rawKey === USER_EMAIL_FILTER_KEY ||
      rawKey === "user_name" ||
      rawKey === "user_email"
    ) {
      clauses.push(
        sql`${eventLog.userEmail} in (${sql.join(
          values.map((v) => sql`${v}`),
          sql`, `,
        )})`,
      );
      continue;
    }

    if (rawKey === "provider") {
      clauses.push(
        sql`${eventLog.provider} in (${sql.join(
          values.map((v) => sql`${v}`),
          sql`, `,
        )})`,
      );
      continue;
    }

    if (rawKey === "requestedModel") {
      clauses.push(
        sql`${eventLog.requestedModel} in (${sql.join(
          values.map((v) => sql`${v}`),
          sql`, `,
        )})`,
      );
      continue;
    }

    // Metadata or child-key tags (either side matching is enough).
    clauses.push(
      sql`(
        ${eventLog.metadataJson} ->> ${rawKey} in (${sql.join(
          values.map((v) => sql`${v}`),
          sql`, `,
        )})
        OR
        ${eventLog.childKeyTagsJson} ->> ${rawKey} in (${sql.join(
          values.map((v) => sql`${v}`),
          sql`, `,
        )})
      )`,
    );
  }

  if (clauses.length === 0) return undefined;
  return and(...clauses);
}

type RawSeriesRow = {
  logDate: string;
  dimensionValue: string;
  requestCount: number;
  totalToken: number;
  cost: number;
};

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function metricFromRow(row: RawSeriesRow, metric: AnalyticsMetric): number {
  if (metric === "totalToken") return row.totalToken;
  if (metric === "cost") return row.cost;
  return row.requestCount;
}

async function fetchLatestLogDate(
  organizationId: string,
): Promise<string | null> {
  const [latestRow] = await db
    .select({
      latestLogDate: sql<string>`max(${eventLog.logDate})`,
    })
    .from(eventLog)
    .where(eq(eventLog.organizationId, organizationId));

  return latestRow?.latestLogDate
    ? String(latestRow.latestLogDate).slice(0, 10)
    : null;
}

/**
 * Aggregate event_log into a stacked time series for the analytics chart.
 *
 * Uses a subquery so the dimension expression is computed once (Postgres
 * rejects GROUP BY when the same expression is re-parameterized).
 */
export async function fetchAnalyticsSeries(
  query: AnalyticsQuery,
): Promise<AnalyticsSeriesResult> {
  // Anchor presets to the latest available log day so empty "today" padding
  // does not appear when ingest lags the calendar.
  const latestLogDate =
    query.datePreset === "custom"
      ? null
      : await fetchLatestLogDate(query.organizationId);
  const range = resolveDateRange(query, latestLogDate);
  const filterClause = buildFilterClauses(query.filters);
  const dimSql = dimensionSqlFragment(query.dimension);

  const whereParts: SQL[] = [
    sql`${eventLog.organizationId} = ${query.organizationId}`,
    sql`${eventLog.logDate} >= ${range.from}`,
    sql`${eventLog.logDate} <= ${range.to}`,
  ];
  if (filterClause) {
    whereParts.push(filterClause);
  }

  // Subquery materializes the dimension once so GROUP BY does not re-bind
  // the same expression with different parameter slots (Postgres 42803).
  const result = await db.execute<RawSeriesRow>(sql`
    select
      s."logDate" as "logDate",
      s."dimensionValue" as "dimensionValue",
      count(*)::int as "requestCount",
      coalesce(sum(s."totalToken"), 0)::float8 as "totalToken",
      coalesce(sum(s."cost"), 0)::float8 as "cost"
    from (
      select
        ${eventLog.logDate} as "logDate",
        ${dimSql} as "dimensionValue",
        ${eventLog.totalToken} as "totalToken",
        ${eventLog.cost} as "cost"
      from ${eventLog}
      where ${sql.join(whereParts, sql` and `)}
    ) as s
    group by s."logDate", s."dimensionValue"
    order by s."logDate"
  `);

  const rows = unwrapExecuteRows<RawSeriesRow>(result);

  const parsedRows: RawSeriesRow[] = rows.map((row) => ({
    logDate:
      typeof row.logDate === "string"
        ? row.logDate.slice(0, 10)
        : toIsoDate(new Date(String(row.logDate))),
    dimensionValue:
      row.dimensionValue && String(row.dimensionValue).length > 0
        ? String(row.dimensionValue)
        : UNKNOWN_SEGMENT,
    requestCount: toNumber(row.requestCount),
    totalToken: toNumber(row.totalToken),
    cost: toNumber(row.cost),
  }));

  const dates = eachDateInclusive(range.from, range.to);

  // Segment totals for ordering + breakdown.
  const segmentTotals = new Map<
    string,
    { requestCount: number; totalToken: number; cost: number }
  >();

  // date → segment → metrics
  const byDate = new Map<
    string,
    Map<string, { requestCount: number; totalToken: number; cost: number }>
  >();

  for (const row of parsedRows) {
    const seg = segmentTotals.get(row.dimensionValue) ?? {
      requestCount: 0,
      totalToken: 0,
      cost: 0,
    };
    seg.requestCount += row.requestCount;
    seg.totalToken += row.totalToken;
    seg.cost += row.cost;
    segmentTotals.set(row.dimensionValue, seg);

    let dayMap = byDate.get(row.logDate);
    if (!dayMap) {
      dayMap = new Map();
      byDate.set(row.logDate, dayMap);
    }
    dayMap.set(row.dimensionValue, {
      requestCount: row.requestCount,
      totalToken: row.totalToken,
      cost: row.cost,
    });
  }

  const segmentKeys = [...segmentTotals.entries()]
    .sort((a, b) => {
      const metricA = metricFromRow(
        {
          logDate: "",
          dimensionValue: a[0],
          ...a[1],
        },
        query.metric,
      );
      const metricB = metricFromRow(
        {
          logDate: "",
          dimensionValue: b[0],
          ...b[1],
        },
        query.metric,
      );
      if (metricB !== metricA) return metricB - metricA;
      return a[0].localeCompare(b[0]);
    })
    .map(([key]) => key);

  const segmentColors = buildSegmentColorMap(segmentKeys);

  const points: AnalyticsSeriesPoint[] = dates.map((date) => {
    const dayMap = byDate.get(date);
    const segments: Record<string, number> = {};
    let total = 0;
    for (const key of segmentKeys) {
      const cell = dayMap?.get(key);
      const value = cell ? metricFromRow({ logDate: date, dimensionValue: key, ...cell }, query.metric) : 0;
      segments[key] = value;
      total += value;
    }
    return { date, segments, total };
  });

  const totals: AnalyticsTotals = {
    requestCount: 0,
    totalToken: 0,
    cost: 0,
  };
  for (const seg of segmentTotals.values()) {
    totals.requestCount += seg.requestCount;
    totals.totalToken += seg.totalToken;
    totals.cost += seg.cost;
  }

  const activeTotal =
    query.metric === "cost"
      ? totals.cost
      : query.metric === "totalToken"
        ? totals.totalToken
        : totals.requestCount;

  const breakdown: AnalyticsSegmentSummary[] = segmentKeys.map((key) => {
    const seg = segmentTotals.get(key)!;
    const metricValue = metricFromRow(
      { logDate: "", dimensionValue: key, ...seg },
      query.metric,
    );
    return {
      key,
      label: key,
      color: segmentColors[key]!,
      requestCount: seg.requestCount,
      totalToken: seg.totalToken,
      cost: seg.cost,
      share: activeTotal > 0 ? metricValue / activeTotal : 0,
    };
  });

  return {
    range,
    metric: query.metric,
    dimension: query.dimension,
    dates,
    segmentKeys,
    segmentColors,
    points,
    totals,
    breakdown,
    empty: parsedRows.length === 0,
  };
}

/**
 * Discover available dimensions and filter values from recent event_log rows.
 */
export async function fetchAnalyticsMeta(
  organizationId: string,
): Promise<AnalyticsMetaResult> {
  const [latestRow] = await db
    .select({
      latestLogDate: sql<string>`max(${eventLog.logDate})`,
    })
    .from(eventLog)
    .where(eq(eventLog.organizationId, organizationId));

  const latestLogDate = latestRow?.latestLogDate
    ? String(latestRow.latestLogDate).slice(0, 10)
    : null;

  // Scan a recent window so discovery stays cheap even on large tables.
  const scanRange = resolveDateRange({ datePreset: "30d" }, latestLogDate);

  const metaKeysPromise = db.execute<{ key: string }>(sql`
    select distinct key
    from ${eventLog},
      lateral jsonb_object_keys(coalesce(${eventLog.metadataJson}, '{}'::jsonb)) as key
    where ${eventLog.organizationId} = ${organizationId}
      and ${eventLog.logDate} >= ${scanRange.from}
      and ${eventLog.logDate} <= ${scanRange.to}
    order by key
    limit 100
  `);

  const tagKeysPromise = db.execute<{ key: string }>(sql`
    select distinct key
    from ${eventLog},
      lateral jsonb_object_keys(coalesce(${eventLog.childKeyTagsJson}, '{}'::jsonb)) as key
    where ${eventLog.organizationId} = ${organizationId}
      and ${eventLog.logDate} >= ${scanRange.from}
      and ${eventLog.logDate} <= ${scanRange.to}
    order by key
    limit 100
  `);

  const [metaKeysResult, tagKeysResult] = await Promise.all([
    metaKeysPromise,
    tagKeysPromise,
  ]);

  const metaKeys = extractKeyRows(metaKeysResult).filter((k) =>
    DIMENSION_KEY_PATTERN.test(k),
  );
  const tagKeys = extractKeyRows(tagKeysResult).filter((k) =>
    DIMENSION_KEY_PATTERN.test(k),
  );

  const dimensions: AnalyticsDimensionOption[] = [
    ...BUILTIN_DIMENSIONS.map((value) => ({
      value,
      label: BUILTIN_DIMENSION_LABELS[value],
      source: "builtin" as const,
    })),
  ];

  const seen = new Set<string>(BUILTIN_DIMENSIONS);

  for (const key of metaKeys) {
    if (seen.has(key)) continue;
    seen.add(key);
    dimensions.push({
      value: key,
      label: humanizeKey(key),
      source: "metadata",
    });
  }

  for (const key of tagKeys) {
    if (seen.has(key)) continue;
    seen.add(key);
    dimensions.push({
      value: key,
      label: humanizeKey(key),
      source: "tag",
    });
  }

  // Preferred multi-select filters first, then remaining discovered keys.
  // User identity is only exposed once as userEmail autocomplete (not multi-select).
  const skipFilterKeys = new Set([
    "user_id",
    "request_id",
    "response_id",
    // Duplicates of event_log.user_email — replaced by USER_EMAIL_FILTER_KEY
    "user_name",
    "user_email",
    USER_EMAIL_FILTER_KEY,
  ]);
  const preferredFilterOrder = [
    "env",
    "team",
    "department",
    "application",
    "provider",
    "requestedModel",
  ];

  const filterKeyCandidates = [
    ...preferredFilterOrder,
    ...metaKeys,
    ...tagKeys,
  ].filter(
    (key, index, arr) =>
      arr.indexOf(key) === index && !skipFilterKeys.has(key),
  );

  const filterOptions: AnalyticsFilterOption[] = [];

  for (const key of filterKeyCandidates) {
    if (!DIMENSION_KEY_PATTERN.test(key) && !isBuiltinDimension(key)) {
      continue;
    }
    const values = await fetchDistinctFilterValues(
      key,
      scanRange,
      organizationId,
    );
    if (values.length === 0) {
      continue;
    }
    filterOptions.push({
      key,
      label: isBuiltinDimension(key)
        ? BUILTIN_DIMENSION_LABELS[key]
        : humanizeKey(key),
      kind: "multiSelect",
      values,
    });
  }

  // Single user filter: event_log.user_email with autocomplete suggestions.
  const userEmails = await fetchDistinctFilterValues(
    USER_EMAIL_FILTER_KEY,
    scanRange,
    organizationId,
  );
  if (userEmails.length > 0) {
    filterOptions.push({
      key: USER_EMAIL_FILTER_KEY,
      label: "User email",
      kind: "userEmail",
      values: userEmails,
    });
  }

  return {
    dimensions,
    filterOptions,
    latestLogDate,
  };
}

async function fetchDistinctFilterValues(
  key: string,
  range: AnalyticsDateRange,
  organizationId: string,
): Promise<string[]> {
  let query;

  if (
    key === USER_EMAIL_FILTER_KEY ||
    key === "user_name" ||
    key === "user_email"
  ) {
    query = sql`
      select distinct ${eventLog.userEmail} as value
      from ${eventLog}
      where ${eventLog.organizationId} = ${organizationId}
        and ${eventLog.logDate} >= ${range.from}
        and ${eventLog.logDate} <= ${range.to}
        and ${eventLog.userEmail} is not null
        and ${eventLog.userEmail} <> ''
      order by value
      limit 200
    `;
  } else if (key === "provider") {
    query = sql`
      select distinct ${eventLog.provider} as value
      from ${eventLog}
      where ${eventLog.organizationId} = ${organizationId}
        and ${eventLog.logDate} >= ${range.from}
        and ${eventLog.logDate} <= ${range.to}
      order by value
      limit 100
    `;
  } else if (key === "requestedModel") {
    query = sql`
      select distinct ${eventLog.requestedModel} as value
      from ${eventLog}
      where ${eventLog.organizationId} = ${organizationId}
        and ${eventLog.logDate} >= ${range.from}
        and ${eventLog.logDate} <= ${range.to}
      order by value
      limit 100
    `;
  } else {
    query = sql`
      select distinct value
      from (
        select nullif(${eventLog.metadataJson} ->> ${key}, '') as value
        from ${eventLog}
        where ${eventLog.organizationId} = ${organizationId}
          and ${eventLog.logDate} >= ${range.from}
          and ${eventLog.logDate} <= ${range.to}
        union
        select nullif(${eventLog.childKeyTagsJson} ->> ${key}, '') as value
        from ${eventLog}
        where ${eventLog.organizationId} = ${organizationId}
          and ${eventLog.logDate} >= ${range.from}
          and ${eventLog.logDate} <= ${range.to}
      ) as values
      where value is not null
      order by value
      limit 100
    `;
  }

  const result = await db.execute<{ value: string }>(query);
  return extractValueRows(result);
}

function extractKeyRows(result: unknown): string[] {
  const rows = unwrapExecuteRows<{ key: string }>(result);
  return rows
    .map((row) => row.key)
    .filter((key): key is string => typeof key === "string" && key.length > 0);
}

function extractValueRows(result: unknown): string[] {
  const rows = unwrapExecuteRows<{ value: string }>(result);
  return rows
    .map((row) => row.value)
    .filter(
      (value): value is string => typeof value === "string" && value.length > 0,
    );
}

/**
 * neon-serverless / drizzle execute may return rows as array or { rows: [] }.
 */
function unwrapExecuteRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) {
    return result as T[];
  }
  if (
    result &&
    typeof result === "object" &&
    "rows" in result &&
    Array.isArray((result as { rows: unknown }).rows)
  ) {
    return (result as { rows: T[] }).rows;
  }
  return [];
}
