import type { AnalyticsMetric } from "./schema";

const numberFormatter = new Intl.NumberFormat("en", {
  maximumFractionDigits: 0,
});

const compactNumberFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const currencyFormatter = new Intl.NumberFormat("en", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat("en", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const dayLabelFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const fullDayFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** Format a YYYY-MM-DD for chart axis (e.g. Jul 26). */
export function formatDayLabel(isoDate: string): string {
  return dayLabelFormatter.format(new Date(`${isoDate}T00:00:00.000Z`));
}

export function formatFullDay(isoDate: string): string {
  return fullDayFormatter.format(new Date(`${isoDate}T00:00:00.000Z`));
}

export function formatMetricValue(
  metric: AnalyticsMetric,
  value: number,
  options?: { compact?: boolean },
): string {
  const compact = options?.compact ?? false;

  if (metric === "cost") {
    if (!Number.isFinite(value)) return "$0.00";
    return compact
      ? compactCurrencyFormatter.format(value)
      : currencyFormatter.format(value);
  }

  if (!Number.isFinite(value)) return "0";
  return compact
    ? compactNumberFormatter.format(value)
    : numberFormatter.format(Math.round(value));
}

export function formatShare(share: number): string {
  if (!Number.isFinite(share) || share <= 0) return "0%";
  if (share >= 0.999) return "100%";
  return `${(share * 100).toFixed(1)}%`;
}

export function formatTokenCount(value: number, compact = true): string {
  if (!Number.isFinite(value)) return "0";
  return compact
    ? compactNumberFormatter.format(value)
    : numberFormatter.format(Math.round(value));
}

/** Human label for a free-form dimension / filter key. */
export function humanizeKey(key: string): string {
  if (key === "user_name") return "User";
  if (key === "requestedModel") return "Model";
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Nice Y-axis ticks for a stacked-bar scale.
 * Returns [0, …, max] with ~4 intermediate steps.
 */
export function niceAxisTicks(maxValue: number, tickCount = 5): number[] {
  if (!Number.isFinite(maxValue) || maxValue <= 0) {
    return [0, 1];
  }

  const roughStep = maxValue / Math.max(tickCount - 1, 1);
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const residual = roughStep / magnitude;
  let niceResidual = 1;
  if (residual > 5) niceResidual = 10;
  else if (residual > 2) niceResidual = 5;
  else if (residual > 1) niceResidual = 2;

  const step = niceResidual * magnitude;
  const niceMax = Math.ceil(maxValue / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= niceMax + step / 1000; value += step) {
    ticks.push(Number(value.toPrecision(12)));
  }
  return ticks;
}
