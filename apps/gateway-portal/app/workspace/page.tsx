import type { ComponentType } from "react";
import Link from "next/link";
import {
  BarChart3,
  ChevronRight,
  CreditCard,
  KeyRound,
  LayoutGrid,
  PlugZap,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wallet,
  Waypoints,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireSession } from "@/lib/auth-server";
import { cn } from "@/lib/utils";

const workspaceNavigation = [
  {
    label: "Overview",
    href: "/workspace",
    icon: LayoutGrid,
    active: true,
  },
  {
    label: "Providers",
    href: "/workspace/providers",
    icon: PlugZap,
  },
  {
    label: "Analytics",
    href: "#analytics",
    icon: BarChart3,
  },
  {
    label: "Guardrails",
    href: "#guardrails",
    icon: ShieldCheck,
  },
  {
    label: "Child Keys",
    href: "#child-keys",
    icon: KeyRound,
  },
  {
    label: "Routing",
    href: "#routing",
    icon: Waypoints,
  },
] as const;

const accountNavigation = [
  {
    label: "Profile",
    href: "#profile",
    icon: UserRound,
  },
  {
    label: "Billing",
    href: "#billing",
    icon: CreditCard,
  },
] as const;

const usagePanels = [
  {
    title: "Spend",
    value: "$3.48",
    legend: [
      { label: "OpenAI GPT-4.1", value: "$1.94", color: "bg-emerald-400" },
      { label: "Anthropic Sonnet", value: "$1.12", color: "bg-sky-400" },
      { label: "Google Gemini", value: "$0.42", color: "bg-amber-400" },
    ],
    bars: [
      ["h-4 bg-emerald-400", "h-6 bg-sky-400"],
      ["h-6 bg-emerald-400", "h-10 bg-sky-400"],
      ["h-3 bg-emerald-400", "h-5 bg-sky-400"],
      ["h-6 bg-emerald-400", "h-8 bg-sky-400"],
      ["h-5 bg-emerald-400", "h-4 bg-amber-400"],
    ],
  },
  {
    title: "Requests",
    value: "1K",
    legend: [
      { label: "Production", value: "614", color: "bg-amber-300" },
      { label: "Staging", value: "249", color: "bg-orange-400" },
      { label: "Internal", value: "105", color: "bg-cyan-400" },
    ],
    bars: [
      ["h-8 bg-amber-300", "h-3 bg-orange-400", "h-2 bg-cyan-400"],
      ["h-7 bg-amber-300", "h-4 bg-orange-400", "h-2 bg-cyan-400"],
      ["h-6 bg-amber-300", "h-2 bg-orange-400", "h-1.5 bg-cyan-400"],
      ["h-7 bg-amber-300", "h-2 bg-orange-400", "h-1.5 bg-cyan-400"],
      ["h-6 bg-amber-300", "h-2 bg-orange-400", "h-1.5 bg-cyan-400"],
    ],
  },
  {
    title: "Tokens",
    value: "28.1M",
    legend: [
      { label: "GPT family", value: "13.1M", color: "bg-amber-300" },
      { label: "Claude family", value: "9.8M", color: "bg-orange-400" },
      { label: "Gemini family", value: "5.2M", color: "bg-cyan-400" },
    ],
    bars: [
      ["h-6 bg-amber-300", "h-4 bg-orange-400", "h-2 bg-cyan-400"],
      ["h-5 bg-amber-300", "h-4 bg-orange-400", "h-2 bg-cyan-400"],
      ["h-4 bg-amber-300", "h-4 bg-orange-400", "h-2 bg-cyan-400"],
      ["h-5 bg-amber-300", "h-4 bg-orange-400", "h-2 bg-cyan-400"],
      ["h-5 bg-amber-300", "h-4 bg-orange-400", "h-2 bg-cyan-400"],
    ],
  },
] as const;

const workspaceCards = [
  {
    title: "Providers",
    description:
      "Manage upstream provider credentials, compatibility types, and pricing metadata.",
    href: "/workspace/providers",
    icon: PlugZap,
    badge: "Live",
    badgeVariant: "success" as const,
    id: "providers",
  },
  {
    title: "Child Keys",
    description:
      "Issue workspace-scoped keys for teams, projects, and applications with budgets attached.",
    href: "#child-keys",
    icon: KeyRound,
    badge: "Planned",
    badgeVariant: "neutral" as const,
    id: "child-keys",
  },
  {
    title: "Guardrails",
    description:
      "Define allow-lists, rate limits, and privacy controls before traffic reaches a provider.",
    href: "#guardrails",
    icon: ShieldCheck,
    badge: "Planned",
    badgeVariant: "neutral" as const,
    id: "guardrails",
  },
  {
    title: "Analytics",
    description:
      "Review requests, tokens, spend, and model behavior across your business dimensions.",
    href: "#analytics",
    icon: BarChart3,
    badge: "Preview",
    badgeVariant: "info" as const,
    id: "analytics-card",
  },
  {
    title: "Routing",
    description:
      "Shape default model paths, fallbacks, and workspace-level traffic preferences.",
    href: "#routing",
    icon: Waypoints,
    badge: "Preview",
    badgeVariant: "info" as const,
    id: "routing",
  },
  {
    title: "Budgets",
    description:
      "Set spend envelopes and usage alerts so teams stay within policy before month end.",
    href: "#billing",
    icon: Wallet,
    badge: "Planned",
    badgeVariant: "warning" as const,
    id: "billing",
  },
] as const;

export default async function WorkspacePage() {
  const session = await requireSession("/workspace");

  return (
    <main className="mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-360 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Card className="border-border bg-surface-1">
            <CardHeader className="gap-4 border-b border-border">
              <div className="rounded-lg border border-border bg-background px-3 py-2.5">
                <p className="text-[11px] font-medium tracking-[0.12em] text-text-tertiary uppercase">
                  Workspace
                </p>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-heading text-[0.95rem] font-semibold text-text-primary">
                      Default Workspace
                    </p>
                    <p className="text-xs text-text-secondary">
                      Personal environment
                    </p>
                  </div>
                  <Badge variant="info">Active</Badge>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-background px-3 py-2.5">
                <p className="text-[11px] font-medium tracking-[0.12em] text-text-tertiary uppercase">
                  Signed in
                </p>
                <p className="mt-1 text-sm font-medium text-text-primary">
                  {session.user.name || "Workspace Admin"}
                </p>
                <p className="truncate text-xs text-text-secondary">
                  {session.user.email}
                </p>
              </div>
            </CardHeader>

            <CardContent className="grid gap-6 pt-5">
              <NavSection title="Workspace" items={workspaceNavigation} />
              <NavSection title="Account" items={accountNavigation} />
            </CardContent>
          </Card>
        </aside>

        <section className="space-y-6">
          <Card className="border-border bg-surface-1">
            <CardHeader className="gap-4 border-b border-border">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Badge variant="info" className="gap-1.5">
                      <Sparkles className="size-3.5" />
                      Workspace overview
                    </Badge>
                    <Badge variant="neutral" className="font-mono">
                      /workspace
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <h1 className="font-heading text-[2rem] leading-[0.98] font-semibold tracking-[-0.04em] text-text-primary sm:text-[2.55rem]">
                      Default Workspace
                    </h1>
                    <p className="max-w-3xl text-sm leading-6 text-text-secondary sm:text-base">
                      We created this workspace for you to manage provider
                      connections, routing rules, analytics, guardrails, and
                      child API keys from one place.
                    </p>
                  </div>
                </div>

                <Link
                  href="#analytics"
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "sm" }),
                  )}
                >
                  View activity
                </Link>
              </div>
            </CardHeader>

            <CardContent className="grid gap-4 pt-5 sm:grid-cols-2 xl:grid-cols-3">
              <SurfaceStat
                label="Active providers"
                value="06"
                description="Across OpenAI, Anthropic, Google, and internal routes."
              />
              <SurfaceStat
                label="Workspace keys"
                value="14"
                description="Child keys issued to teams, projects, and apps."
              />
              <SurfaceStat
                label="Guardrail coverage"
                value="87%"
                description="Requests routed through at least one active policy."
              />
            </CardContent>
          </Card>

          <section id="analytics" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-[1.15rem] font-semibold text-text-primary">
                  This week&apos;s usage
                </h2>
                <p className="text-sm text-text-secondary">
                  UI preview metrics for spend, requests, and token volume.
                </p>
              </div>
              <Button variant="ghost" size="sm">
                View activity
              </Button>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              {usagePanels.map((panel) => (
                <UsagePanel key={panel.title} {...panel} />
              ))}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {workspaceCards.map((card) => (
              <WorkspaceFeatureCard key={card.title} {...card} />
            ))}
          </section>
        </section>
      </div>
    </main>
  );
}

function NavSection({
  title,
  items,
}: {
  title: string;
  items: ReadonlyArray<{
    label: string;
    href: string;
    icon: ComponentType<{ className?: string }>;
    active?: boolean;
  }>;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium tracking-[0.12em] text-text-tertiary uppercase">
        {title}
      </p>
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                item.active
                  ? "bg-accent-subtle text-text-primary"
                  : "text-text-secondary hover:bg-surface-2 hover:text-text-primary",
              )}
            >
              <Icon
                className={cn(
                  "size-4",
                  item.active ? "text-accent" : "text-text-tertiary",
                )}
              />
              <span className="flex-1">{item.label}</span>
              <ChevronRight
                className={cn(
                  "size-4 transition-transform group-hover:translate-x-0.5",
                  item.active ? "text-accent" : "text-text-tertiary",
                )}
              />
            </Link>
          );
        })}
      </nav>
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
    <div className="rounded-lg border border-border bg-background px-4 py-4">
      <p className="text-[11px] font-medium tracking-[0.12em] text-text-tertiary uppercase">
        {label}
      </p>
      <p className="mt-2 font-heading text-[1.9rem] font-semibold tracking-[-0.04em] text-text-primary">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-text-secondary">
        {description}
      </p>
    </div>
  );
}

function UsagePanel({
  title,
  value,
  legend,
  bars,
}: {
  title: string;
  value: string;
  legend: ReadonlyArray<{
    label: string;
    value: string;
    color: string;
  }>;
  bars: ReadonlyArray<ReadonlyArray<string>>;
}) {
  return (
    <Card className="border-border bg-surface-1">
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription>{title}</CardDescription>
            <CardTitle className="mt-1 text-[1.95rem] tracking-[-0.04em]">
              {value}
            </CardTitle>
          </div>
          <div className="rounded-md border border-border bg-background p-2 text-text-tertiary">
            <BarChart3 className="size-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex h-28 items-end gap-2">
          {bars.map((stack, index) => (
            <div key={index} className="flex flex-1 flex-col justify-end gap-1">
              {stack.map((barClass, barIndex) => (
                <div
                  key={`${index}-${barIndex}`}
                  className={cn("w-full rounded-xs", barClass)}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="space-y-2.5">
          {legend.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <div className="flex items-center gap-2.5 text-text-secondary">
                <span className={cn("size-2 rounded-full", item.color)} />
                <span>{item.label}</span>
              </div>
              <span className="font-medium text-text-primary">
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
  id,
}: {
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  badge: string;
  badgeVariant: "neutral" | "info" | "success" | "warning" | "error";
  id: string;
}) {
  return (
    <Link href={href} id={id} className="group block">
      <Card className="h-full border-border bg-surface-1 transition-colors hover:border-border-strong hover:bg-surface-2">
        <CardHeader className="gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="rounded-md border border-border bg-background p-2 text-accent">
              <Icon className="size-4" />
            </div>
            <Badge variant={badgeVariant}>{badge}</Badge>
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-[1.05rem]">{title}</CardTitle>
            <CardDescription className="leading-6">
              {description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-sm font-medium text-text-secondary group-hover:text-text-primary">
          Open area
          <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </CardContent>
      </Card>
    </Link>
  );
}
