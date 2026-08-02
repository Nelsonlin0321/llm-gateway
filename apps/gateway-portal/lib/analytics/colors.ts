/**
 * Stacked-segment palette aligned with portal chart tokens + extended accents.
 * First five map to --chart-1…5; remaining cycle through a curated set.
 */
export const SEGMENT_COLOR_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-3)",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#e11d48",
  "#a78bfa",
  "#22d3ee",
  "#fb7185",
] as const;

export function colorForSegment(index: number): string {
  return SEGMENT_COLOR_PALETTE[index % SEGMENT_COLOR_PALETTE.length]!;
}

export function buildSegmentColorMap(keys: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  keys.forEach((key, index) => {
    map[key] = colorForSegment(index);
  });
  return map;
}
