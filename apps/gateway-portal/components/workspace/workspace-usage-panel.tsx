import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { OverviewUsagePanel } from "@/lib/workspace/overview";
import { cn } from "@/lib/utils";

type WorkspaceUsagePanelProps = {
  panel: OverviewUsagePanel;
};

export function WorkspaceUsagePanel({ panel }: WorkspaceUsagePanelProps) {
  return (
    <Card className="border-border bg-card shadow-card">
      <CardHeader className="gap-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription className="text-[11px] tracking-[0.08em] uppercase">
              {panel.title}
              <span className="ml-1.5 normal-case tracking-normal text-text-muted">
                by {panel.dimensionLabel.toLowerCase()}
              </span>
            </CardDescription>
            <CardTitle className="mt-1 text-2xl tracking-[-0.03em] tabular-nums">
              {panel.value}
            </CardTitle>
          </div>
          <span className="text-[11px] text-text-tertiary">
            {panel.rangeLabel}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {panel.empty ? (
          <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-border bg-surface-2/40 px-3 text-center text-[12px] text-text-secondary">
            No usage events in this range.
          </div>
        ) : (
          <>
            <div className="flex h-24 items-end gap-1.5">
              {panel.bars.map((stack, index) => (
                <div
                  key={index}
                  className="flex h-full flex-1 flex-col justify-end gap-0.5"
                >
                  {/* Render top of stack first so visual order matches legend priority */}
                  {[...stack].reverse().map((seg) => (
                    <div
                      key={seg.key}
                      title={seg.key === "__other__" ? "Other" : seg.key}
                      className="w-full min-h-px rounded-[2px] opacity-90"
                      style={{
                        height: `${Math.max(seg.heightPct, 1.5)}%`,
                        background: seg.color,
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {panel.legend.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 text-[13px]"
                >
                  <div className="flex min-w-0 items-center gap-2 text-text-secondary">
                    <span
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ background: item.color }}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <span className="shrink-0 font-medium tabular-nums text-text-primary">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        <Link
          href={panel.analyticsHref}
          className={cn(
            "inline-flex text-[12px] font-medium text-text-tertiary transition-colors",
            "hover:text-text-primary",
          )}
        >
          Open in Analytics →
        </Link>
      </CardContent>
    </Card>
  );
}
