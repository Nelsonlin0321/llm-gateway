import type { ComponentType } from "react";
import Link from "next/link";
import {
  BarChart3,
  Building2,
  ChevronRight,
  KeyRound,
  PlugZap,
  ShieldCheck,
  Wallet,
  Waypoints,
} from "lucide-react";

import { getWorkspaceOverview } from "@/app/server-actions/workspace/get-workspace-overview";
import { WorkspaceUsagePanel } from "@/components/workspace/workspace-usage-panel";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMetricValue } from "@/lib/analytics/format";

function workspaceCards(organizationId: string) {
  const orgBase = `/org/${organizationId}`;
  return [
    {
      title: "Providers",
      description: "Upstream credentials, endpoints, and compatibility modes.",
      href: `${orgBase}/providers`,
      icon: PlugZap,
      badge: "Live",
      badgeVariant: "success" as const,
    },
    {
      title: "Child Keys",
      description: "Issue and rotate scoped keys for teams and applications.",
      href: `${orgBase}/child-keys`,
      icon: KeyRound,
      badge: "Live",
      badgeVariant: "success" as const,
    },
    {
      title: "Organization",
      description:
        "Create orgs, invite members, and assign root, admin, or viewer.",
      href: "/organization",
      icon: Building2,
      badge: "Live",
      badgeVariant: "success" as const,
    },
    {
      title: "Guardrails",
      description: "Model allow-lists, rate limits, and privacy controls.",
      href: "#guardrails",
      icon: ShieldCheck,
      badge: "Planned",
      badgeVariant: "neutral" as const,
    },
    {
      title: "Analytics",
      description: "Requests, tokens, latency, and spend by dimension.",
      href: `${orgBase}/analytics`,
      icon: BarChart3,
      badge: "Live",
      badgeVariant: "success" as const,
    },
    {
      title: "Routing",
      description: "Default model paths, fallbacks, and traffic preferences.",
      href: "#routing",
      icon: Waypoints,
      badge: "Preview",
      badgeVariant: "info" as const,
    },
    {
      title: "Budgets",
      description: "Spend envelopes and alerts before month-end overages.",
      href: "#billing",
      icon: Wallet,
      badge: "Planned",
      badgeVariant: "warning" as const,
    },
  ] as const;
}

export async function WorkspaceOverviewSection({
  organizationId,
}: {
  organizationId: string;
}) {
  const result = await getWorkspaceOverview(organizationId);

  if (!result.ok) {
    return (
      <div className="rounded-lg border border-error/30 bg-error-bg px-5 py-6">
        <p className="font-heading text-sm font-semibold text-error">
          Could not load overview
        </p>
        <p className="mt-1 text-[13px] text-text-secondary">{result.error}</p>
      </div>
    );
  }

  const { stats, usage } = result.data;

  return (
    <>
      <section className="grid gap-3 sm:grid-cols-3">
        <SurfaceStat
          label="Active providers"
          value={padCount(stats.activeProviders)}
          description={
            stats.totalProviders === stats.activeProviders
              ? "Connected upstream endpoints"
              : `${stats.totalProviders} total registered`
          }
        />
        <SurfaceStat
          label="Workspace keys"
          value={padCount(stats.workspaceKeys)}
          description={
            stats.activeKeys === stats.workspaceKeys
              ? "Issued to teams and apps"
              : `${stats.activeKeys} active`
          }
        />
        <SurfaceStat
          label="Requests (7d)"
          value={formatMetricValue("requestCount", stats.requestCount7d, {
            compact: true,
          })}
          description={`${formatMetricValue("cost", stats.cost7d)} spend`}
        />
      </section>

      <section id="analytics" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-base font-semibold tracking-[-0.02em] text-text-primary">
              Usage this week
            </h2>
            <p className="mt-0.5 text-sm text-text-secondary">
              Live from <span className="font-mono text-[12px]">event_log</span>
              {usage.from && usage.to ? ` · ${usage.from} → ${usage.to}` : null}
              . Explore deeper in{" "}
              <Link
                href={`/org/${organizationId}/analytics`}
                className="font-medium text-text-primary underline-offset-4 hover:underline"
              >
                Analytics
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-3">
          {usage.panels.map((panel) => (
            <WorkspaceUsagePanel key={panel.id} panel={panel} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-base font-semibold tracking-[-0.02em] text-text-primary">
            Control areas
          </h2>
          <p className="mt-0.5 text-sm text-text-secondary">
            Jump into configuration and governance workflows.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {workspaceCards(organizationId).map((card) => (
            <WorkspaceFeatureCard key={card.title} {...card} />
          ))}
        </div>
      </section>
    </>
  );
}

function padCount(value: number): string {
  if (value < 10) return value.toString().padStart(2, "0");
  return new Intl.NumberFormat("en").format(value);
}

function SurfaceStat({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-4 shadow-card">
      <p className="text-[11px] font-medium tracking-[0.08em] text-text-tertiary uppercase">
        {label}
      </p>
      <p className="mt-2 font-heading text-2xl font-semibold tracking-[-0.03em] text-text-primary tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-[13px] text-text-secondary">{description}</p>
    </div>
  );
}

function WorkspaceFeatureCard({
  title,
  description,
  href,
  icon: Icon,
  badge,
  badgeVariant,
}: {
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  badge: string;
  badgeVariant: "neutral" | "info" | "success" | "warning" | "error";
}) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full border-border bg-card shadow-card transition-colors hover:border-border-strong hover:bg-surface-2">
        <CardHeader className="gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex size-8 items-center justify-center rounded-md border border-border bg-surface-2 text-text-secondary">
              <Icon className="size-4" />
            </div>
            <Badge variant={badgeVariant}>{badge}</Badge>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-sm">{title}</CardTitle>
            <CardDescription className="text-[13px] leading-5">
              {description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex items-center gap-1.5 text-[13px] font-medium text-text-tertiary group-hover:text-text-primary">
          Open
          <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </CardContent>
      </Card>
    </Link>
  );
}
