import type { ComponentType } from "react";
import Link from "next/link";
import {
  BarChart3,
  ChevronRight,
  KeyRound,
  PlugZap,
  ShieldCheck,
  Wallet,
  Waypoints,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

const usagePanels = [
  {
    title: "Spend",
    value: "$3.48",
    delta: "Last 7 days",
    legend: [
      { label: "OpenAI GPT-4.1", value: "$1.94", color: "bg-chart-4" },
      { label: "Anthropic Sonnet", value: "$1.12", color: "bg-chart-2" },
      { label: "Google Gemini", value: "$0.42", color: "bg-chart-5" },
    ],
    bars: [
      ["h-4 bg-chart-4", "h-6 bg-chart-2"],
      ["h-6 bg-chart-4", "h-10 bg-chart-2"],
      ["h-3 bg-chart-4", "h-5 bg-chart-2"],
      ["h-6 bg-chart-4", "h-8 bg-chart-2"],
      ["h-5 bg-chart-4", "h-4 bg-chart-5"],
    ],
  },
  {
    title: "Requests",
    value: "1,024",
    delta: "Last 7 days",
    legend: [
      { label: "Production", value: "614", color: "bg-chart-5" },
      { label: "Staging", value: "249", color: "bg-chart-1" },
      { label: "Internal", value: "105", color: "bg-chart-2" },
    ],
    bars: [
      ["h-8 bg-chart-5", "h-3 bg-chart-1", "h-2 bg-chart-2"],
      ["h-7 bg-chart-5", "h-4 bg-chart-1", "h-2 bg-chart-2"],
      ["h-6 bg-chart-5", "h-2 bg-chart-1", "h-1.5 bg-chart-2"],
      ["h-7 bg-chart-5", "h-2 bg-chart-1", "h-1.5 bg-chart-2"],
      ["h-6 bg-chart-5", "h-2 bg-chart-1", "h-1.5 bg-chart-2"],
    ],
  },
  {
    title: "Tokens",
    value: "28.1M",
    delta: "Last 7 days",
    legend: [
      { label: "GPT family", value: "13.1M", color: "bg-chart-5" },
      { label: "Claude family", value: "9.8M", color: "bg-chart-1" },
      { label: "Gemini family", value: "5.2M", color: "bg-chart-2" },
    ],
    bars: [
      ["h-6 bg-chart-5", "h-4 bg-chart-1", "h-2 bg-chart-2"],
      ["h-5 bg-chart-5", "h-4 bg-chart-1", "h-2 bg-chart-2"],
      ["h-4 bg-chart-5", "h-4 bg-chart-1", "h-2 bg-chart-2"],
      ["h-5 bg-chart-5", "h-4 bg-chart-1", "h-2 bg-chart-2"],
      ["h-5 bg-chart-5", "h-4 bg-chart-1", "h-2 bg-chart-2"],
    ],
  },
] as const;

const workspaceCards = [
  {
    title: "Providers",
    description: "Upstream credentials, endpoints, and compatibility modes.",
    href: "/workspace/providers",
    icon: PlugZap,
    badge: "Live",
    badgeVariant: "success" as const,
  },
  {
    title: "Child Keys",
    description: "Issue and rotate scoped keys for teams and applications.",
    href: "/workspace/child-keys",
    icon: KeyRound,
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
    href: "/workspace/analytics",
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

export default function WorkspacePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace"
        title="Overview"
        description="Monitor usage, manage providers, and govern access from a single control plane."
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <SurfaceStat
          label="Active providers"
          value="06"
          description="Connected upstream endpoints"
        />
        <SurfaceStat
          label="Workspace keys"
          value="14"
          description="Issued to teams and apps"
        />
        <SurfaceStat
          label="Guardrail coverage"
          value="87%"
          description="Requests under policy"
        />
      </section>

      <section id="analytics" className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-base font-semibold tracking-[-0.02em] text-text-primary">
              Usage this week
            </h2>
            <p className="mt-0.5 text-sm text-text-secondary">
              Preview snapshot — open{" "}
              <Link
                href="/workspace/analytics"
                className="font-medium text-text-primary underline-offset-4 hover:underline"
              >
                Analytics
              </Link>{" "}
              for live stacked usage by dimension.
            </p>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-3">
          {usagePanels.map((panel) => (
            <UsagePanel key={panel.title} {...panel} />
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
          {workspaceCards.map((card) => (
            <WorkspaceFeatureCard key={card.title} {...card} />
          ))}
        </div>
      </section>
    </div>
  );
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

function UsagePanel({
  title,
  value,
  delta,
  legend,
  bars,
}: {
  title: string;
  value: string;
  delta: string;
  legend: ReadonlyArray<{
    label: string;
    value: string;
    color: string;
  }>;
  bars: ReadonlyArray<ReadonlyArray<string>>;
}) {
  return (
    <Card className="border-border bg-card shadow-card">
      <CardHeader className="gap-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription className="text-[11px] tracking-[0.08em] uppercase">
              {title}
            </CardDescription>
            <CardTitle className="mt-1 text-2xl tracking-[-0.03em] tabular-nums">
              {value}
            </CardTitle>
          </div>
          <span className="text-[11px] text-text-tertiary">{delta}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex h-24 items-end gap-1.5">
          {bars.map((stack, index) => (
            <div key={index} className="flex flex-1 flex-col justify-end gap-0.5">
              {stack.map((barClass, barIndex) => (
                <div
                  key={`${index}-${barIndex}`}
                  className={cn("w-full rounded-[2px] opacity-90", barClass)}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {legend.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-3 text-[13px]"
            >
              <div className="flex items-center gap-2 text-text-secondary">
                <span className={cn("size-1.5 rounded-full", item.color)} />
                <span>{item.label}</span>
              </div>
              <span className="font-medium tabular-nums text-text-primary">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
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
