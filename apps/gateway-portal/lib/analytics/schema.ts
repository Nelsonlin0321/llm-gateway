import { z } from "zod";

/** Metrics that drive the chart Y-axis. */
export const ANALYTICS_METRICS = ["requestCount", "totalToken", "cost"] as const;
export type AnalyticsMetric = (typeof ANALYTICS_METRICS)[number];

/** Built-in dimensions (columns on event_log). */
export const BUILTIN_DIMENSIONS = [
  "provider",
  "requestedModel",
  "user_name",
] as const;
export type BuiltinDimension = (typeof BUILTIN_DIMENSIONS)[number];

/**
 * Dimension used for stacked segments.
 * - Built-in: provider | requestedModel | user_name
 * - Dynamic: any key discovered from metadataJson / childKeyTagsJson
 */
export type AnalyticsDimension = string;

export const DATE_PRESETS = ["7d", "30d", "custom"] as const;
export type DatePreset = (typeof DATE_PRESETS)[number];

/** Metadata / tag key pattern — prevents SQL injection via dynamic keys. */
export const DIMENSION_KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9_.-]{0,63}$/;

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

const dimensionSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(DIMENSION_KEY_PATTERN, "Invalid dimension key");

const filterValueSchema = z
  .string()
  .min(1)
  .max(128)
  .transform((value) => value.trim())
  .refine((value) => value.length > 0, "Filter value cannot be empty");

export const analyticsQuerySchema = z
  .object({
    organizationId: z.string().trim().min(1, "Organization is required."),
    metric: z.enum(ANALYTICS_METRICS).default("requestCount"),
    dimension: dimensionSchema.default("provider"),
    datePreset: z.enum(DATE_PRESETS).default("7d"),
    /** Inclusive start (YYYY-MM-DD). Required when datePreset is custom. */
    from: isoDateSchema.optional(),
    /** Inclusive end (YYYY-MM-DD). Required when datePreset is custom. */
    to: isoDateSchema.optional(),
    /**
     * Optional equality filters keyed by metadata/tag field name.
     * Values are OR'd within a key; keys are AND'd together.
     * Special key `userEmail` filters event_log.user_email.
     */
    filters: z
      .record(dimensionSchema, z.array(filterValueSchema).max(50))
      .default({}),
  })
  .superRefine((value, ctx) => {
    if (value.datePreset === "custom") {
      if (!value.from || !value.to) {
        ctx.addIssue({
          code: "custom",
          message: "Custom range requires both from and to dates.",
          path: ["from"],
        });
        return;
      }
      if (value.from > value.to) {
        ctx.addIssue({
          code: "custom",
          message: "from must be on or before to.",
          path: ["from"],
        });
      }
    }
  });

export type AnalyticsQueryInput = z.input<typeof analyticsQuerySchema>;
export type AnalyticsQuery = z.output<typeof analyticsQuerySchema>;

export type AnalyticsDateRange = {
  from: string;
  to: string;
  preset: DatePreset;
};

export type AnalyticsSeriesPoint = {
  date: string;
  segments: Record<string, number>;
  total: number;
};

export type AnalyticsSegmentSummary = {
  key: string;
  label: string;
  color: string;
  requestCount: number;
  totalToken: number;
  cost: number;
  /** Share of the active metric (0–1). */
  share: number;
};

export type AnalyticsTotals = {
  requestCount: number;
  totalToken: number;
  cost: number;
};

export type AnalyticsSeriesResult = {
  range: AnalyticsDateRange;
  metric: AnalyticsMetric;
  dimension: AnalyticsDimension;
  /** Ordered dates (YYYY-MM-DD) spanning the full range. */
  dates: string[];
  /** Segment keys in stable order (by total desc). */
  segmentKeys: string[];
  /** Color map for each segment key. */
  segmentColors: Record<string, string>;
  /** One row per date with segment values for the selected metric. */
  points: AnalyticsSeriesPoint[];
  totals: AnalyticsTotals;
  /** Segment rollup for legend + breakdown table. */
  breakdown: AnalyticsSegmentSummary[];
  /** True when no events matched filters/range. */
  empty: boolean;
};

export type AnalyticsDimensionOption = {
  value: string;
  label: string;
  source: "builtin" | "metadata" | "tag";
};

/**
 * Filter control kinds:
 * - multiSelect: dropdown multi-select over discrete values
 * - userEmail: text input with autocomplete over event_log.user_email
 */
export type AnalyticsFilterKind = "multiSelect" | "userEmail";

/** Canonical filter key for event_log.user_email (not metadata user_email / user_name). */
export const USER_EMAIL_FILTER_KEY = "userEmail";

export type AnalyticsFilterOption = {
  key: string;
  label: string;
  kind: AnalyticsFilterKind;
  /** Discrete options (multiSelect) or autocomplete suggestions (userEmail). */
  values: string[];
};

export type AnalyticsMetaResult = {
  dimensions: AnalyticsDimensionOption[];
  filterOptions: AnalyticsFilterOption[];
  /** Max log_date present in event_log (for defaulting ranges). */
  latestLogDate: string | null;
};

export const METRIC_LABELS: Record<AnalyticsMetric, string> = {
  requestCount: "Request count",
  totalToken: "Total tokens",
  cost: "Cost",
};

export const BUILTIN_DIMENSION_LABELS: Record<BuiltinDimension, string> = {
  provider: "Provider",
  requestedModel: "Model",
  user_name: "User",
};

export function isBuiltinDimension(value: string): value is BuiltinDimension {
  return (BUILTIN_DIMENSIONS as readonly string[]).includes(value);
}

export function validateAnalyticsQuery(input: unknown) {
  return analyticsQuerySchema.safeParse(input);
}
