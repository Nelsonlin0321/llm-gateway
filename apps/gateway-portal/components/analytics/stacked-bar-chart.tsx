"use client";

import { useMemo, useState } from "react";

import {
  formatDayLabel,
  formatFullDay,
  formatMetricValue,
  niceAxisTicks,
} from "@/lib/analytics/format";
import type {
  AnalyticsMetric,
  AnalyticsSeriesPoint,
} from "@/lib/analytics/schema";
import { cn } from "@/lib/utils";

type StackedBarChartProps = {
  points: AnalyticsSeriesPoint[];
  segmentKeys: string[];
  segmentColors: Record<string, string>;
  metric: AnalyticsMetric;
  className?: string;
  /** Chart height in px (plot area). */
  height?: number;
};

type HoverState = {
  date: string;
  index: number;
  x: number;
  y: number;
};

const CHART_PAD = { top: 12, right: 12, bottom: 28, left: 48 };

export function StackedBarChart({
  points,
  segmentKeys,
  segmentColors,
  metric,
  className,
  height = 280,
}: StackedBarChartProps) {
  const [hover, setHover] = useState<HoverState | null>(null);

  const maxStack = useMemo(
    () => Math.max(0, ...points.map((p) => p.total)),
    [points],
  );

  const ticks = useMemo(() => niceAxisTicks(maxStack, 5), [maxStack]);
  const yMax = ticks[ticks.length - 1] ?? 1;

  const width = 800; // viewBox width; scales via CSS
  const plotW = width - CHART_PAD.left - CHART_PAD.right;
  const plotH = height - CHART_PAD.top - CHART_PAD.bottom;

  const barGap = points.length > 20 ? 0.22 : points.length > 10 ? 0.28 : 0.34;
  const slot = plotW / Math.max(points.length, 1);
  const barWidth = Math.max(4, slot * (1 - barGap));

  const yScale = (value: number) =>
    CHART_PAD.top + plotH - (value / yMax) * plotH;

  const xCenter = (index: number) =>
    CHART_PAD.left + slot * index + slot / 2;

  // Sparse x labels when many days.
  const labelEvery = points.length > 20 ? 4 : points.length > 12 ? 2 : 1;

  const hoverPoint = hover ? points[hover.index] : null;

  return (
    <div className={cn("relative w-full select-none", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label="Stacked bar chart of usage by day"
        onMouseLeave={() => setHover(null)}
      >
        {/* Grid lines */}
        {ticks.map((tick) => {
          const y = yScale(tick);
          return (
            <g key={tick}>
              <line
                x1={CHART_PAD.left}
                x2={width - CHART_PAD.right}
                y1={y}
                y2={y}
                stroke="var(--border)"
                strokeWidth={1}
                strokeDasharray={tick === 0 ? undefined : "3 4"}
              />
              <text
                x={CHART_PAD.left - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-text-tertiary"
                style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
              >
                {formatMetricValue(metric, tick, { compact: true })}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {points.map((point, index) => {
          let yCursor = yScale(0);
          const cx = xCenter(index);
          const x = cx - barWidth / 2;
          const isActive = hover?.index === index;

          return (
            <g key={point.date}>
              {segmentKeys.map((key) => {
                const value = point.segments[key] ?? 0;
                if (value <= 0) return null;
                const segmentH = (value / yMax) * plotH;
                const y = yCursor - segmentH;
                yCursor = y;
                return (
                  <rect
                    key={key}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(segmentH, 0.5)}
                    fill={segmentColors[key]}
                    opacity={isActive || !hover ? 0.95 : 0.45}
                    rx={1.5}
                    ry={1.5}
                  />
                );
              })}

              {/* Hit area */}
              <rect
                x={CHART_PAD.left + slot * index}
                y={CHART_PAD.top}
                width={slot}
                height={plotH}
                fill="transparent"
                onMouseEnter={(event) => {
                  const rect = (
                    event.currentTarget.ownerSVGElement as SVGSVGElement
                  ).getBoundingClientRect();
                  const scaleX = rect.width / width;
                  const scaleY = rect.height / height;
                  setHover({
                    date: point.date,
                    index,
                    x: cx * scaleX,
                    y: yScale(point.total) * scaleY,
                  });
                }}
                onMouseMove={(event) => {
                  const rect = (
                    event.currentTarget.ownerSVGElement as SVGSVGElement
                  ).getBoundingClientRect();
                  const scaleX = rect.width / width;
                  const scaleY = rect.height / height;
                  setHover({
                    date: point.date,
                    index,
                    x: cx * scaleX,
                    y: yScale(point.total) * scaleY,
                  });
                }}
              />

              {index % labelEvery === 0 || index === points.length - 1 ? (
                <text
                  x={cx}
                  y={height - 8}
                  textAnchor="middle"
                  className="fill-text-tertiary"
                  style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
                >
                  {formatDayLabel(point.date)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      {hover && hoverPoint ? (
        <div
          className="pointer-events-none absolute z-10 min-w-[180px] max-w-[260px] rounded-md border border-border bg-popover px-3 py-2.5 shadow-card"
          style={{
            left: Math.min(
              Math.max(hover.x, 90),
              // keep inside container — approx via percentage later if needed
              hover.x,
            ),
            top: Math.max(hover.y - 8, 8),
            transform: "translate(-50%, -100%)",
          }}
        >
          <p className="text-[11px] font-medium tracking-[0.06em] text-text-tertiary uppercase">
            {formatFullDay(hoverPoint.date)}
          </p>
          <p className="mt-1 font-heading text-sm font-semibold tabular-nums text-text-primary">
            {formatMetricValue(metric, hoverPoint.total)}
            <span className="ml-1.5 text-[12px] font-normal text-text-secondary">
              total
            </span>
          </p>
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
            {[...segmentKeys]
              .filter((key) => (hoverPoint.segments[key] ?? 0) > 0)
              .sort(
                (a, b) =>
                  (hoverPoint.segments[b] ?? 0) - (hoverPoint.segments[a] ?? 0),
              )
              .map((key) => (
                <li
                  key={key}
                  className="flex items-center justify-between gap-3 text-[12px]"
                >
                  <span className="flex min-w-0 items-center gap-1.5 text-text-secondary">
                    <span
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ background: segmentColors[key] }}
                    />
                    <span className="truncate">{key}</span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums text-text-primary">
                    {formatMetricValue(metric, hoverPoint.segments[key] ?? 0, {
                      compact: true,
                    })}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
