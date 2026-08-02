import { and, count, eq } from "drizzle-orm";

import {
  formatMetricValue,
  formatTokenCount,
} from "@/lib/analytics/format";
import {
  type AnalyticsMetric,
  type AnalyticsSeriesResult,
} from "@/lib/analytics/schema";
import { fetchAnalyticsSeries } from "@/lib/analytics/service";
import { childKeys, db, llmProviders } from "@/lib/db";

const LEGEND_LIMIT = 4;
const MAX_BAR_DAYS = 7;

export type OverviewLegendItem = {
  label: string;
  value: string;
  color: string;
};

/** One day column: segments from bottom → top for CSS flex-col-reverse or justify-end. */
export type OverviewBarSegment = {
  key: string;
  color: string;
  /** Height as percent of the tallest day stack (0–100). */
  heightPct: number;
};

export type OverviewUsagePanel = {
  id: "cost" | "requests" | "tokens";
  title: string;
  value: string;
  rangeLabel: string;
  dimensionLabel: string;
  metric: AnalyticsMetric;
  dimension: string;
  legend: OverviewLegendItem[];
  /** Stacked mini-bars, one entry per day (oldest → newest). */
  bars: OverviewBarSegment[][];
  empty: boolean;
  /** Deep link into full analytics with matching metric/dimension. */
  analyticsHref: string;
};

export type WorkspaceOverview = {
  stats: {
    activeProviders: number;
    totalProviders: number;
    workspaceKeys: number;
    activeKeys: number;
    requestCount7d: number;
    cost7d: number;
  };
  usage: {
    rangeLabel: string;
    from: string;
    to: string;
    panels: OverviewUsagePanel[];
  };
};

type PanelSpec = {
  id: OverviewUsagePanel["id"];
  title: string;
  metric: AnalyticsMetric;
  dimension: string;
  dimensionLabel: string;
};

const PANEL_SPECS: PanelSpec[] = [
  {
    id: "cost",
    title: "Spend",
    metric: "cost",
    dimension: "provider",
    dimensionLabel: "Provider",
  },
  {
    id: "requests",
    title: "Requests",
    metric: "requestCount",
    dimension: "env",
    dimensionLabel: "Env",
  },
  {
    id: "tokens",
    title: "Tokens",
    metric: "totalToken",
    dimension: "requestedModel",
    dimensionLabel: "Model",
  },
];

function metricTotal(
  series: AnalyticsSeriesResult,
  metric: AnalyticsMetric,
): number {
  if (metric === "cost") return series.totals.cost;
  if (metric === "totalToken") return series.totals.totalToken;
  return series.totals.requestCount;
}

function formatPanelValue(metric: AnalyticsMetric, value: number): string {
  if (metric === "totalToken") {
    return formatTokenCount(value, true);
  }
  return formatMetricValue(metric, value, { compact: metric !== "cost" });
}

function segmentMetricValue(
  row: AnalyticsSeriesResult["breakdown"][number],
  metric: AnalyticsMetric,
): number {
  if (metric === "cost") return row.cost;
  if (metric === "totalToken") return row.totalToken;
  return row.requestCount;
}

function buildLegend(
  series: AnalyticsSeriesResult,
  metric: AnalyticsMetric,
): OverviewLegendItem[] {
  const top = series.breakdown.slice(0, LEGEND_LIMIT);
  const rest = series.breakdown.slice(LEGEND_LIMIT);

  const items: OverviewLegendItem[] = top.map((row) => ({
    label: row.label,
    value: formatPanelValue(metric, segmentMetricValue(row, metric)),
    color: row.color,
  }));

  if (rest.length > 0) {
    const otherValue = rest.reduce(
      (sum, row) => sum + segmentMetricValue(row, metric),
      0,
    );
    items.push({
      label: `Other (${rest.length})`,
      value: formatPanelValue(metric, otherValue),
      color: "var(--chart-3)",
    });
  }

  return items;
}

/**
 * Build mini stacked bars from series points.
 * Collapses segments beyond LEGEND_LIMIT into a single "Other" band per day.
 */
function buildBars(series: AnalyticsSeriesResult): OverviewBarSegment[][] {
  const points = series.points.slice(-MAX_BAR_DAYS);
  const topKeys = series.segmentKeys.slice(0, LEGEND_LIMIT);
  const otherKeys = new Set(series.segmentKeys.slice(LEGEND_LIMIT));
  const otherColor = "var(--chart-3)";

  const maxTotal = Math.max(0, ...points.map((p) => p.total));
  if (maxTotal <= 0) {
    return points.map(() => []);
  }

  return points.map((point) => {
    const segments: OverviewBarSegment[] = [];

    // Stack order: smaller segments first visually from bottom in justify-end column
    // (we render bottom-up via flex-col-reverse so top keys appear at top of stack)
    for (const key of [...topKeys].reverse()) {
      const value = point.segments[key] ?? 0;
      if (value <= 0) continue;
      segments.push({
        key,
        color: series.segmentColors[key] ?? "var(--chart-3)",
        heightPct: (value / maxTotal) * 100,
      });
    }

    if (otherKeys.size > 0) {
      let other = 0;
      for (const key of otherKeys) {
        other += point.segments[key] ?? 0;
      }
      if (other > 0) {
        segments.push({
          key: "__other__",
          color: otherColor,
          heightPct: (other / maxTotal) * 100,
        });
      }
    }

    return segments;
  });
}

function analyticsHref(metric: AnalyticsMetric, dimension: string): string {
  const params = new URLSearchParams({
    metric,
    dimension,
    range: "7d",
  });
  return `/workspace/analytics?${params.toString()}`;
}

function toUsagePanel(
  spec: PanelSpec,
  series: AnalyticsSeriesResult,
): OverviewUsagePanel {
  const total = metricTotal(series, spec.metric);
  const rangeLabel =
    series.range.preset === "7d"
      ? "Last 7 days"
      : series.range.preset === "30d"
        ? "Last 30 days"
        : `${series.range.from} – ${series.range.to}`;

  return {
    id: spec.id,
    title: spec.title,
    value: series.empty ? "—" : formatPanelValue(spec.metric, total),
    rangeLabel,
    dimensionLabel: spec.dimensionLabel,
    metric: spec.metric,
    dimension: spec.dimension,
    legend: series.empty ? [] : buildLegend(series, spec.metric),
    bars: series.empty ? [] : buildBars(series),
    empty: series.empty,
    analyticsHref: analyticsHref(spec.metric, spec.dimension),
  };
}

/**
 * Load workspace overview KPIs + usage snapshot panels from real tables.
 */
export async function fetchWorkspaceOverview(
  userId: string,
): Promise<WorkspaceOverview> {
  const [
    activeProviderRows,
    totalProviderRows,
    activeKeyRows,
    totalKeyRows,
    costSeries,
    requestSeries,
    tokenSeries,
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(llmProviders)
      .where(
        and(eq(llmProviders.creatorId, userId), eq(llmProviders.isActive, true)),
      ),
    db
      .select({ value: count() })
      .from(llmProviders)
      .where(eq(llmProviders.creatorId, userId)),
    db
      .select({ value: count() })
      .from(childKeys)
      .where(and(eq(childKeys.creatorId, userId), eq(childKeys.isActive, true))),
    db
      .select({ value: count() })
      .from(childKeys)
      .where(eq(childKeys.creatorId, userId)),
    fetchAnalyticsSeries({
      metric: "cost",
      dimension: "provider",
      datePreset: "7d",
      filters: {},
    }),
    fetchAnalyticsSeries({
      metric: "requestCount",
      dimension: "env",
      datePreset: "7d",
      filters: {},
    }),
    fetchAnalyticsSeries({
      metric: "totalToken",
      dimension: "requestedModel",
      datePreset: "7d",
      filters: {},
    }),
  ]);

  const panels = [
    toUsagePanel(PANEL_SPECS[0]!, costSeries),
    toUsagePanel(PANEL_SPECS[1]!, requestSeries),
    toUsagePanel(PANEL_SPECS[2]!, tokenSeries),
  ];

  const rangeLabel = panels[0]?.rangeLabel ?? "Last 7 days";

  return {
    stats: {
      activeProviders: Number(activeProviderRows[0]?.value ?? 0),
      totalProviders: Number(totalProviderRows[0]?.value ?? 0),
      workspaceKeys: Number(totalKeyRows[0]?.value ?? 0),
      activeKeys: Number(activeKeyRows[0]?.value ?? 0),
      requestCount7d: requestSeries.totals.requestCount,
      cost7d: costSeries.totals.cost,
    },
    usage: {
      rangeLabel,
      from: requestSeries.range.from,
      to: requestSeries.range.to,
      panels,
    },
  };
}
