"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { BarChart3, Loader2, RefreshCw } from "lucide-react";

import { getAnalyticsSeries } from "@/app/server-actions/analytics/get-analytics-series";
import { AnalyticsBreakdown } from "@/components/analytics/analytics-breakdown";
import {
  AnalyticsControls,
  type AnalyticsControlsState,
} from "@/components/analytics/analytics-controls";
import { AnalyticsKpiRow } from "@/components/analytics/analytics-kpi-row";
import { StackedBarChart } from "@/components/analytics/stacked-bar-chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatFullDay,
  formatMetricValue,
  humanizeKey,
} from "@/lib/analytics/format";
import {
  BUILTIN_DIMENSION_LABELS,
  isBuiltinDimension,
  METRIC_LABELS,
  type AnalyticsMetaResult,
  type AnalyticsSeriesResult,
} from "@/lib/analytics/schema";
import { cn } from "@/lib/utils";

type AnalyticsDashboardProps = {
  initialMeta: AnalyticsMetaResult;
  initialSeries: AnalyticsSeriesResult;
  initialQuery: AnalyticsControlsState;
};

function dimensionLabel(
  dimension: string,
  meta: AnalyticsMetaResult,
): string {
  const found = meta.dimensions.find((d) => d.value === dimension);
  if (found) return found.label;
  if (isBuiltinDimension(dimension)) return BUILTIN_DIMENSION_LABELS[dimension];
  return humanizeKey(dimension);
}

function rangeLabel(series: AnalyticsSeriesResult): string {
  if (series.range.preset === "7d") return "Last 7 days";
  if (series.range.preset === "30d") return "Last 30 days";
  return `${formatFullDay(series.range.from)} – ${formatFullDay(series.range.to)}`;
}

export function AnalyticsDashboard({
  initialMeta,
  initialSeries,
  initialQuery,
}: AnalyticsDashboardProps) {
  const [meta] = useState(initialMeta);
  const [query, setQuery] = useState<AnalyticsControlsState>(initialQuery);
  const [series, setSeries] = useState(initialSeries);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const customDateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dimLabel = useMemo(
    () => dimensionLabel(series.dimension, meta),
    [series.dimension, meta],
  );

  const reload = useCallback((nextQuery: AnalyticsControlsState) => {
    startTransition(async () => {
      setError(null);
      const result = await getAnalyticsSeries({
        metric: nextQuery.metric,
        dimension: nextQuery.dimension,
        datePreset: nextQuery.datePreset,
        from: nextQuery.datePreset === "custom" ? nextQuery.from : undefined,
        to: nextQuery.datePreset === "custom" ? nextQuery.to : undefined,
        filters: nextQuery.filters,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSeries(result.data);
    });
  }, []);

  const handleControlsChange = (patch: Partial<AnalyticsControlsState>) => {
    const next = { ...query, ...patch };
    // When switching to custom, seed from/to from current series range if empty.
    if (patch.datePreset === "custom") {
      if (!next.from) next.from = series.range.from;
      if (!next.to) next.to = series.range.to;
    }
    setQuery(next);

    const isDateEdit = patch.from !== undefined || patch.to !== undefined;

    if (next.datePreset === "custom") {
      if (!next.from || !next.to || next.from > next.to) return;

      if (isDateEdit) {
        if (customDateTimer.current) clearTimeout(customDateTimer.current);
        customDateTimer.current = setTimeout(() => reload(next), 350);
        return;
      }
    }

    if (customDateTimer.current) {
      clearTimeout(customDateTimer.current);
      customDateTimer.current = null;
    }
    reload(next);
  };

  return (
    <div className="space-y-6">
      <AnalyticsControls
        state={query}
        dimensions={meta.dimensions}
        filterOptions={meta.filterOptions}
        onChange={handleControlsChange}
        isLoading={isPending}
      />

      <AnalyticsKpiRow
        totals={series.totals}
        activeMetric={query.metric}
        rangeLabel={rangeLabel(series)}
        onSelectMetric={(metric) => handleControlsChange({ metric })}
      />

      <Card className="border-border bg-card shadow-card">
        <CardHeader className="gap-2 border-b border-border pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardDescription className="text-[11px] tracking-[0.08em] uppercase">
                Stacked bar · {METRIC_LABELS[series.metric]} by day
              </CardDescription>
              <CardTitle className="text-base tracking-[-0.02em]">
                {dimLabel} over time
              </CardTitle>
              <p className="text-[13px] text-text-secondary">
                {rangeLabel(series)}
                {series.segmentKeys.length > 0
                  ? ` · ${series.segmentKeys.length} segment${series.segmentKeys.length === 1 ? "" : "s"}`
                  : null}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isPending ? (
                <span className="inline-flex items-center gap-1.5 text-[12px] text-text-tertiary">
                  <Loader2 className="size-3.5 animate-spin" />
                  Updating
                </span>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => reload(query)}
              >
                <RefreshCw
                  className={cn("size-3.5", isPending && "animate-spin")}
                />
                Refresh
              </Button>
            </div>
          </div>

          {/* Legend */}
          {series.segmentKeys.length > 0 ? (
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
              {series.breakdown.slice(0, 12).map((seg) => (
                <div
                  key={seg.key}
                  className="flex items-center gap-1.5 text-[12px] text-text-secondary"
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ background: seg.color }}
                  />
                  <span className="max-w-[140px] truncate">{seg.label}</span>
                  <span className="tabular-nums text-text-tertiary">
                    {formatMetricValue(series.metric, metricValue(seg, series.metric), {
                      compact: true,
                    })}
                  </span>
                </div>
              ))}
              {series.breakdown.length > 12 ? (
                <span className="text-[12px] text-text-muted">
                  +{series.breakdown.length - 12} more
                </span>
              ) : null}
            </div>
          ) : null}
        </CardHeader>

        <CardContent className="pt-4">
          {error ? (
            <div className="rounded-md border border-error/30 bg-error-bg px-4 py-3 text-sm text-error">
              {error}
            </div>
          ) : series.empty ? (
            <EmptyChartState />
          ) : (
            <StackedBarChart
              points={series.points}
              segmentKeys={series.segmentKeys}
              segmentColors={series.segmentColors}
              metric={series.metric}
            />
          )}
        </CardContent>
      </Card>

      <AnalyticsBreakdown
        breakdown={series.breakdown}
        metric={series.metric}
        dimensionLabel={dimLabel}
      />
    </div>
  );
}

function metricValue(
  seg: AnalyticsSeriesResult["breakdown"][number],
  metric: AnalyticsSeriesResult["metric"],
): number {
  if (metric === "cost") return seg.cost;
  if (metric === "totalToken") return seg.totalToken;
  return seg.requestCount;
}

function EmptyChartState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <div className="flex size-10 items-center justify-center rounded-md border border-border bg-surface-2 text-text-tertiary">
        <BarChart3 className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="font-heading text-sm font-semibold text-text-primary">
          No usage events in this range
        </p>
        <p className="max-w-sm text-[13px] text-text-secondary">
          Adjust the date range or clear filters. Metrics only appear when
          gateway requests have been logged to{" "}
          <span className="font-mono text-[12px]">event_log</span>.
        </p>
      </div>
    </div>
  );
}
