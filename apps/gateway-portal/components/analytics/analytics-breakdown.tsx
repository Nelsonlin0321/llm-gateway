import {
  formatMetricValue,
  formatShare,
  formatTokenCount,
} from "@/lib/analytics/format";
import type {
  AnalyticsMetric,
  AnalyticsSegmentSummary,
} from "@/lib/analytics/schema";
import { cn } from "@/lib/utils";

type AnalyticsBreakdownProps = {
  breakdown: AnalyticsSegmentSummary[];
  metric: AnalyticsMetric;
  dimensionLabel: string;
};

export function AnalyticsBreakdown({
  breakdown,
  metric,
  dimensionLabel,
}: AnalyticsBreakdownProps) {
  if (breakdown.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-text-secondary">
        No dimension breakdown for this range.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
      <div className="border-b border-border px-4 py-3">
        <p className="text-[11px] font-medium tracking-[0.08em] text-text-tertiary uppercase">
          Breakdown by {dimensionLabel}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-border bg-surface-2/60 text-[11px] tracking-[0.06em] text-text-tertiary uppercase">
              <th className="px-4 py-2.5 font-medium">{dimensionLabel}</th>
              <th className="px-4 py-2.5 font-medium tabular-nums">Requests</th>
              <th className="px-4 py-2.5 font-medium tabular-nums">Tokens</th>
              <th className="px-4 py-2.5 font-medium tabular-nums">Cost</th>
              <th className="px-4 py-2.5 font-medium tabular-nums">Share</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((row) => (
              <tr
                key={row.key}
                className="border-b border-border last:border-0 hover:bg-surface-2/40"
              >
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: row.color }}
                      aria-hidden
                    />
                    <span className="font-medium text-text-primary">
                      {row.label}
                    </span>
                  </span>
                </td>
                <td
                  className={cn(
                    "px-4 py-2.5 tabular-nums text-text-secondary",
                    metric === "requestCount" && "font-medium text-text-primary",
                  )}
                >
                  {formatMetricValue("requestCount", row.requestCount)}
                </td>
                <td
                  className={cn(
                    "px-4 py-2.5 tabular-nums text-text-secondary",
                    metric === "totalToken" && "font-medium text-text-primary",
                  )}
                >
                  {formatTokenCount(row.totalToken, true)}
                </td>
                <td
                  className={cn(
                    "px-4 py-2.5 tabular-nums text-text-secondary",
                    metric === "cost" && "font-medium text-text-primary",
                  )}
                >
                  {formatMetricValue("cost", row.cost)}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex min-w-[100px] items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, row.share * 100)}%`,
                          background: row.color,
                        }}
                      />
                    </div>
                    <span className="w-12 text-right text-[12px] tabular-nums text-text-secondary">
                      {formatShare(row.share)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
