import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { getAnalyticsMeta } from "@/app/server-actions/analytics/get-analytics-meta";
import { getAnalyticsSeries } from "@/app/server-actions/analytics/get-analytics-series";
import type { AnalyticsControlsState } from "@/components/analytics/analytics-controls";

/**
 * Server-side loader for the analytics dashboard.
 * Prefetches meta + default series (request count by env/provider, last 7d).
 */
export async function AnalyticsSection({
  organizationId,
}: {
  organizationId: string;
}) {
  const metaResult = await getAnalyticsMeta(organizationId);

  if (!metaResult.ok) {
    return (
      <ErrorPanel
        title="Could not load analytics metadata"
        message={metaResult.error}
      />
    );
  }

  const meta = metaResult.data;

  // Prefer `env` dimension when present (matches product example); else provider.
  const defaultDimension =
    meta.dimensions.find((d) => d.value === "env")?.value ??
    meta.dimensions.find((d) => d.value === "provider")?.value ??
    "provider";

  const seriesResult = await getAnalyticsSeries({
    organizationId,
    metric: "requestCount",
    dimension: defaultDimension,
    datePreset: "7d",
    filters: {},
  });

  if (!seriesResult.ok) {
    return (
      <ErrorPanel
        title="Could not load analytics series"
        message={seriesResult.error}
      />
    );
  }

  const series = seriesResult.data;

  // Keep custom date inputs aligned with the resolved preset range.
  const initialQuery: AnalyticsControlsState = {
    metric: series.metric,
    dimension: series.dimension,
    datePreset: series.range.preset,
    from: series.range.from,
    to: series.range.to,
    filters: {},
  };

  return (
    <AnalyticsDashboard
      organizationId={organizationId}
      initialMeta={meta}
      initialSeries={series}
      initialQuery={initialQuery}
    />
  );
}

function ErrorPanel({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-lg border border-error/30 bg-error-bg px-5 py-6">
      <p className="font-heading text-sm font-semibold text-error">{title}</p>
      <p className="mt-1 text-[13px] text-text-secondary">{message}</p>
    </div>
  );
}
