import { Activity, Coins, Hash } from "lucide-react";

import {
  formatMetricValue,
  formatTokenCount,
} from "@/lib/analytics/format";
import type { AnalyticsTotals } from "@/lib/analytics/schema";
import { cn } from "@/lib/utils";

type AnalyticsKpiRowProps = {
  totals: AnalyticsTotals;
  activeMetric: "requestCount" | "totalToken" | "cost";
  onSelectMetric?: (metric: "requestCount" | "totalToken" | "cost") => void;
  rangeLabel: string;
};

const kpis = [
  {
    key: "requestCount" as const,
    label: "Requests",
    icon: Hash,
    format: (t: AnalyticsTotals) =>
      formatMetricValue("requestCount", t.requestCount),
  },
  {
    key: "totalToken" as const,
    label: "Tokens",
    icon: Activity,
    format: (t: AnalyticsTotals) => formatTokenCount(t.totalToken, true),
  },
  {
    key: "cost" as const,
    label: "Cost",
    icon: Coins,
    format: (t: AnalyticsTotals) => formatMetricValue("cost", t.cost),
  },
] as const;

export function AnalyticsKpiRow({
  totals,
  activeMetric,
  onSelectMetric,
  rangeLabel,
}: AnalyticsKpiRowProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const active = activeMetric === kpi.key;
        return (
          <button
            key={kpi.key}
            type="button"
            onClick={() => onSelectMetric?.(kpi.key)}
            className={cn(
              "rounded-lg border bg-card px-4 py-4 text-left shadow-card transition-colors",
              active
                ? "border-accent/40 bg-accent-subtle"
                : "border-border hover:border-border-strong hover:bg-surface-2",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium tracking-[0.08em] text-text-tertiary uppercase">
                {kpi.label}
              </p>
              <Icon
                className={cn(
                  "size-3.5",
                  active ? "text-accent" : "text-text-tertiary",
                )}
              />
            </div>
            <p className="mt-2 font-heading text-2xl font-semibold tracking-[-0.03em] text-text-primary tabular-nums">
              {kpi.format(totals)}
            </p>
            <p className="mt-1 text-[12px] text-text-secondary">{rangeLabel}</p>
          </button>
        );
      })}
    </div>
  );
}
