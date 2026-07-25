import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BadgeDollarSign,
  ChartNoAxesCombined,
  ChevronRight,
  Cloud,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const stats = [
  {
    label: "Providers onboarded",
    value: "12",
    detail: "OpenAI, Anthropic, Gemini, Azure, and private endpoints",
  },
  {
    label: "Policies enforced",
    value: "148",
    detail: "Rate limits, allow-lists, model guards, and budget controls",
  },
  {
    label: "Child keys issued",
    value: "3.8k",
    detail: "Scoped to teams, projects, applications, and environments",
  },
  {
    label: "Spend visibility",
    value: "99.2%",
    detail: "Cost attribution by provider, model, team, user, and key",
  },
] as const;

const featureCards = [
  {
    icon: Cloud,
    title: "Provider control without credential sprawl",
    description:
      "Store upstream URLs and master keys once, then standardize provider metadata, failover posture, and rollout state from a single control plane.",
    bullets: [
      "Master API URL and credential vaulting",
      "Provider health, readiness, and rollout status",
      "Expandable support for multiple upstreams",
    ],
  },
  {
    icon: KeyRound,
    title: "Child key issuance with real governance",
    description:
      "Create downstream keys for teams, users, projects, and applications while keeping model access, limits, and ownership explicit.",
    bullets: [
      "Scoped access by team, project, application, or user",
      "Budget caps, per-model policies, and spend ceilings",
      "Lifecycle views for active, rotated, and revoked keys",
    ],
  },
  {
    icon: ChartNoAxesCombined,
    title: "Pricing and analytics built for operators",
    description:
      "Map token pricing to cost, then monitor requests, tokens, latency, errors, and spend across the dimensions that finance and platform teams actually need.",
    bullets: [
      "Input and output token cost configuration",
      "Analytics by provider, model, key, and time range",
      "Operational traces for auditing sensitive actions",
    ],
  },
] as const;

const workflowSteps = [
  {
    step: "01",
    title: "Connect providers",
    detail:
      "Register upstream URLs, provider metadata, and primary credentials.",
  },
  {
    step: "02",
    title: "Price every model",
    detail: "Define input and output token costs so reporting stays accurate.",
  },
  {
    step: "03",
    title: "Issue child keys",
    detail:
      "Assign ownership, access limits, budgets, and model policy per tenant.",
  },
  {
    step: "04",
    title: "Watch usage and cost",
    detail:
      "Inspect requests, spend, latency, and errors with auditability built in.",
  },
] as const;

const auditRows = [
  {
    path: "/providers/openai/master-key",
    event: "Rotated credential",
    actor: "platform-admin",
    status: "success",
  },
  {
    path: "/policies/team-growth",
    event: "Raised budget cap",
    actor: "finance-ops",
    status: "review",
  },
  {
    path: "/keys/project-rag-prod",
    event: "Issued child key",
    actor: "team-admin",
    status: "success",
  },
] as const;

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex w-full flex-col gap-8 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)]">
          <Card className="overflow-hidden border-[color-mix(in_srgb,var(--accent)_14%,var(--border))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-1)_96%,transparent),color-mix(in_srgb,var(--surface-1)_84%,transparent))]">
            <CardHeader className="gap-5 pb-4 sm:pb-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="info" className="gap-1.5">
                  <Sparkles className="size-3.5" />
                  Framer-aligned control plane
                </Badge>
                <Badge
                  variant="neutral"
                  className="font-mono text-[11px] uppercase tracking-[0.08em]"
                >
                  /portal/home
                </Badge>
              </div>
              <div className="space-y-5">
                <h1 className="max-w-3xl [font-family:var(--font-display)] text-[3rem] leading-[0.96] font-semibold tracking-tighter text-foreground sm:text-[4.4rem]">
                  Run every provider, policy, and token dollar from one
                  black-stage console.
                </h1>
                <p className="max-w-2xl text-base leading-7 tracking-[-0.01em] text-text-secondary sm:text-lg">
                  Gateway Portal is the management and analytics layer between
                  your upstream AI providers and every downstream team, user,
                  project, and application that depends on them.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#launch"
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "h-10 rounded-lg border border-white/8 px-4 text-sm font-semibold",
                  )}
                >
                  Start with provider setup
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="#workflow"
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "lg" }),
                    "h-10 rounded-lg border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-secondary px-4 text-sm text-foreground",
                  )}
                >
                  Review the workflow
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <MiniPanel
                  title="Secure credentials"
                  value="Master provider keys stay centralized and hidden from downstream apps."
                />
                <MiniPanel
                  title="Multi-tenant issuance"
                  value="Child API keys map to teams, users, projects, and applications."
                />
                <MiniPanel
                  title="Cost-grade analytics"
                  value="Track usage, latency, errors, tokens, and spend across business dimensions."
                />
              </div>
            </CardContent>
          </Card>

          <ProductCanvas />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card
              key={stat.label}
              className="bg-[color-mix(in_srgb,var(--surface-1)_92%,transparent)]"
            >
              <CardContent className="flex h-full flex-col gap-3 p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
                  {stat.label}
                </p>
                <p className="[font-family:var(--font-display)] text-4xl leading-none font-semibold tracking-[-0.04em]">
                  {stat.value}
                </p>
                <p className="text-sm leading-6 text-text-secondary">
                  {stat.detail}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Card className="bg-[color-mix(in_srgb,var(--surface-1)_92%,transparent)]">
            <CardHeader>
              <Badge
                variant="neutral"
                className="w-fit font-mono text-[11px] uppercase tracking-[0.08em]"
              >
                Why this exists
              </Badge>
              <CardTitle>
                Built for platform admins, team owners, developers, and finance
                operations.
              </CardTitle>
              <CardDescription>
                The landing page centers the exact workflows described for the
                portal: provider connection, model pricing, child key lifecycle,
                policy enforcement, analytics, and audit logging.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <AudiencePanel
                title="Platform admins"
                detail="Govern providers, master credentials, pricing metadata, and global policies."
              />
              <AudiencePanel
                title="Team admins"
                detail="Issue keys for their teams and keep limits, model access, and budgets aligned."
              />
              <AudiencePanel
                title="Developers"
                detail="Consume assigned child keys without touching upstream provider secrets."
              />
              <AudiencePanel
                title="Finance and ops"
                detail="Review spend, cost attribution, anomalies, and budget posture across time."
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {featureCards.map((feature, index) => {
              const Icon = feature.icon;
              const sectionId =
                index === 0
                  ? "providers-card"
                  : index === 1
                    ? "keys-card"
                    : "pricing-card";

              return (
                <Card
                  key={feature.title}
                  id={sectionId}
                  className="h-full bg-[color-mix(in_srgb,var(--surface-1)_92%,transparent)]"
                >
                  <CardHeader className="gap-4">
                    <div className="flex size-10 items-center justify-center rounded-2xl border border-border bg-secondary text-foreground">
                      <Icon className="size-4" />
                    </div>
                    <CardTitle className="text-[1.35rem]">
                      {feature.title}
                    </CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {feature.bullets.map((bullet) => (
                      <div
                        key={bullet}
                        className="flex items-start gap-3 rounded-2xl border border-border bg-secondary/60 px-4 py-3 text-sm leading-6 text-text-secondary"
                      >
                        <ChevronRight className="mt-1 size-4 shrink-0 text-accent" />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section
          id="workflow"
          className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]"
        >
          <Card
            id="analytics"
            className="bg-[color-mix(in_srgb,var(--surface-1)_92%,transparent)]"
          >
            <CardHeader>
              <Badge
                variant="neutral"
                className="w-fit font-mono text-[11px] uppercase tracking-[0.08em]"
              >
                Workflow
              </Badge>
              <CardTitle>
                From provider onboarding to spend accountability.
              </CardTitle>
              <CardDescription>
                The portal is framed as an operator workflow, not a generic
                marketing site, so each step maps directly to production
                responsibilities.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {workflowSteps.map((step, index) => (
                <div key={step.step}>
                  <div className="grid gap-3 rounded-2xl bg-secondary/70 p-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-start">
                    <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-accent">
                      {step.step}
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-base font-semibold tracking-[-0.02em] text-foreground">
                        {step.title}
                      </h3>
                      <p className="text-sm leading-6 text-text-secondary">
                        {step.detail}
                      </p>
                    </div>
                  </div>
                  {index < workflowSteps.length - 1 ? (
                    <Separator className="my-3 bg-border" />
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card
            id="launch"
            className="overflow-hidden border-[color-mix(in_srgb,var(--accent)_16%,var(--border))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-1)_96%,transparent),color-mix(in_srgb,var(--accent-subtle)_28%,var(--surface-1)))]"
          >
            <CardHeader>
              <Badge variant="info" className="w-fit gap-1.5">
                <ShieldCheck className="size-3.5" />
                Governance ready
              </Badge>
              <CardTitle>
                Enforce access, budgets, and rate limits before tokens leave the
                building.
              </CardTitle>
              <CardDescription>
                Policies are first-class objects here: allow-lists, spend caps,
                and throughput controls stay visible right beside key issuance
                and model pricing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <SignalTile
                  label="Spend guard"
                  value="$12k monthly cap"
                  hint="Applied to team-growth"
                  icon={<BadgeDollarSign className="size-4" />}
                />
                <SignalTile
                  label="Rate policy"
                  value="240 req/min"
                  hint="Scoped to project-rag-prod"
                  icon={<Activity className="size-4" />}
                />
                <SignalTile
                  label="Model access"
                  value="7 approved models"
                  hint="GPT-4.1, Claude 4, Gemini 2.5"
                  icon={<LockKeyhole className="size-4" />}
                />
                <SignalTile
                  label="Readiness"
                  value="99.95% live"
                  hint="Provider failover configured"
                  icon={<Cloud className="size-4" />}
                />
              </div>
              <div className="rounded-[24px] border border-border bg-background/70 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
                      Suggested first action
                    </p>
                    <p className="mt-1 text-sm leading-6 text-text-secondary">
                      Connect one upstream provider, price its models, then
                      issue a child key with a team budget and a model
                      allow-list.
                    </p>
                  </div>
                  <Link
                    href="#workflow"
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "lg" }),
                      "h-10 rounded-lg border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-secondary px-4 text-sm",
                    )}
                  >
                    See onboarding sequence
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section
          id="audit"
          className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]"
        >
          <Card className="bg-[color-mix(in_srgb,var(--surface-1)_92%,transparent)]">
            <CardHeader className="gap-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <Badge
                    variant="neutral"
                    className="w-fit font-mono text-[11px] uppercase tracking-[0.08em]"
                  >
                    Audit logging
                  </Badge>
                  <CardTitle>
                    Real-looking traces keep the landing page product-led.
                  </CardTitle>
                </div>
                <Badge variant="success" className="w-fit">
                  Audit trail active
                </Badge>
              </div>
              <CardDescription>
                Technical traces use mono sparingly and only where the page
                needs to feel like a trustworthy operator console.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {auditRows.map((row, index) => (
                <div key={row.path}>
                  <div className="grid gap-3 rounded-2xl border border-border bg-secondary/70 p-4 md:grid-cols-[minmax(0,1fr)_150px_120px_auto] md:items-center">
                    <div className="space-y-1">
                      <p className="font-mono text-xs leading-5 text-text-secondary">
                        {row.path}
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {row.event}
                      </p>
                    </div>
                    <p className="text-sm text-text-secondary">{row.actor}</p>
                    <p className="text-sm text-text-tertiary">
                      07:3{index} UTC
                    </p>
                    <Badge
                      variant={row.status === "success" ? "success" : "warning"}
                      className="w-fit"
                    >
                      {row.status === "success" ? "Synced" : "Needs review"}
                    </Badge>
                  </div>
                  {index < auditRows.length - 1 ? (
                    <Separator className="my-3 bg-border" />
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-[color-mix(in_srgb,var(--surface-1)_92%,transparent)]">
            <CardHeader>
              <Badge
                variant="neutral"
                className="w-fit font-mono text-[11px] uppercase tracking-[0.08em]"
              >
                Analytics
              </Badge>
              <CardTitle>
                Usage and cost by every dimension that matters.
              </CardTitle>
              <CardDescription>
                Provider, model, team, user, project, application, API key, and
                time range stay visible as first-class reporting cuts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Provider and model cost breakout",
                "Latency, request volume, and error trends",
                "Spend allocation by team and project",
                "Key-level usage for chargeback and review",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-border bg-secondary/70 px-4 py-3 text-sm leading-6 text-text-secondary"
                >
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

function MiniPanel({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/70 p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{value}</p>
    </div>
  );
}

function AudiencePanel({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/70 p-4">
      <p className="text-sm font-semibold tracking-[-0.02em] text-foreground">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{detail}</p>
    </div>
  );
}

function SignalTile({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
          {label}
        </p>
        <div className="text-text-secondary">{icon}</div>
      </div>
      <p className="mt-3 text-base font-semibold tracking-[-0.02em] text-foreground">
        {value}
      </p>
      <p className="mt-1 text-sm leading-6 text-text-secondary">{hint}</p>
    </div>
  );
}

function ProductCanvas() {
  return (
    <Card className="overflow-hidden border-[color-mix(in_srgb,var(--accent)_14%,var(--border))] bg-[linear-gradient(180deg,var(--surface-1),color-mix(in_srgb,var(--surface-2)_80%,var(--surface-1)))] shadow-hero">
      <CardContent className="p-0">
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-error" />
                <span className="size-2 rounded-full bg-warning" />
                <span className="size-2 rounded-full bg-success" />
              </div>
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
                /org/acme-gateway
              </p>
            </div>
            <Badge variant="info" className="gap-1.5">
              <Sparkles className="size-3.5" />
              Publish ready
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[188px_minmax(0,1fr)]">
            <div className="rounded-[20px] border border-border bg-background/60 p-3">
              <div className="space-y-2">
                {[
                  "Overview",
                  "Providers",
                  "Pricing",
                  "Keys",
                  "Policies",
                  "Analytics",
                ].map((item, index) => (
                  <div
                    key={item}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors",
                      index === 1
                        ? "bg-accent-subtle text-accent"
                        : "text-text-secondary",
                    )}
                  >
                    <span>{item}</span>
                    <ChevronRight className="size-4" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_280px]">
                <div className="rounded-[20px] border border-border bg-background/60 p-4">
                  <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
                        Provider control
                      </p>
                      <p className="mt-1 text-base font-semibold tracking-[-0.02em] text-foreground">
                        Master credentials and rollout state
                      </p>
                    </div>
                    <Link
                      href="#providers-card"
                      className={cn(
                        buttonVariants({ variant: "secondary", size: "lg" }),
                        "h-9 rounded-lg border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-secondary px-3 text-sm",
                      )}
                    >
                      Review provider setup
                    </Link>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {[
                      {
                        provider: "OpenAI",
                        endpoint: "gateway.openai.com",
                        models: "14 models",
                        status: "Healthy",
                      },
                      {
                        provider: "Anthropic",
                        endpoint: "api.anthropic.com",
                        models: "8 models",
                        status: "Synced",
                      },
                      {
                        provider: "Azure OpenAI",
                        endpoint: "azure-westus.internal",
                        models: "6 deployments",
                        status: "Ready",
                      },
                    ].map((provider) => (
                      <div
                        key={provider.provider}
                        className="grid gap-3 rounded-2xl border border-border bg-secondary/60 p-4 sm:grid-cols-[minmax(0,1fr)_auto]"
                      >
                        <div>
                          <p className="text-sm font-semibold tracking-[-0.02em] text-foreground">
                            {provider.provider}
                          </p>
                          <p className="mt-1 font-mono text-xs text-text-secondary">
                            {provider.endpoint}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="neutral">{provider.models}</Badge>
                          <Badge variant="success">{provider.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[20px] border border-border bg-background/60 p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
                    Live signals
                  </p>
                  <div className="mt-4 grid gap-3">
                    {[
                      {
                        label: "Requests",
                        value: "9.2M",
                        delta: "+12.4%",
                      },
                      {
                        label: "Tokens",
                        value: "4.8B",
                        delta: "+8.1%",
                      },
                      {
                        label: "Spend",
                        value: "$74.3k",
                        delta: "+4.9%",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-border bg-secondary/60 p-4"
                      >
                        <p className="text-sm text-text-secondary">
                          {item.label}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <p className="[font-family:var(--font-display)] text-3xl leading-none font-semibold tracking-[-0.04em]">
                            {item.value}
                          </p>
                          <Badge variant="info">{item.delta}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
                <div className="rounded-[20px] border border-border bg-background/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
                        Policy coverage
                      </p>
                      <p className="mt-1 text-base font-semibold tracking-[-0.02em] text-foreground">
                        Requests by governance state
                      </p>
                    </div>
                    <Badge variant="neutral">Last 24 hours</Badge>
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    {[
                      {
                        label: "Budget guarded",
                        width: "w-[92%]",
                        value: "71%",
                      },
                      {
                        label: "Model restricted",
                        width: "w-[76%]",
                        value: "58%",
                      },
                      {
                        label: "Rate limited",
                        width: "w-[62%]",
                        value: "43%",
                      },
                    ].map((bar) => (
                      <div key={bar.label} className="space-y-3">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-text-secondary">
                            {bar.label}
                          </span>
                          <span className="font-medium text-foreground">
                            {bar.value}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary">
                          <div
                            className={cn(
                              "h-2 rounded-full bg-accent",
                              bar.width,
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[20px] border border-border bg-background/60 p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
                    Child key queue
                  </p>
                  <div className="mt-4 space-y-3">
                    {[
                      "team-growth / prod / gpt-4.1",
                      "project-rag / stage / claude-sonnet",
                      "app-chat / web / gemini-2.5-pro",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-border bg-secondary/60 px-3 py-3 font-mono text-xs text-text-secondary"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
