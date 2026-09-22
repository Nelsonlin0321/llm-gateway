import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ChartNoAxesCombined,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Zap,
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
import {
  getSiteUrl,
  serializeJsonLd,
  siteName,
  siteTagline,
  siteTitle,
} from "@/lib/site";
import { getSessionOrNull } from "@/lib/auth-server";
import { cn } from "@/lib/utils";

const homeDescription =
  "Ultra-lightweight LLM gateway. A 372 KB Hono proxy on Bun — 108 KB gzip, about 0.16 ms of added latency at p50 versus a direct call — plus a control plane for providers, child keys, and spend.";

const speedFacts = [
  {
    value: "372 KB",
    label: "Minified proxy",
    detail: "Hono on Bun, six dependencies",
  },
  {
    value: "108 KB",
    label: "Gzip bundle",
    detail: "Compressed bundle on the wire",
  },
  {
    value: "0.16 ms",
    label: "Added latency",
    detail: "P50 versus a direct mock. P99 0.30 ms.",
  },
] as const;

const capabilities = [
  {
    icon: Zap,
    title: "Lightweight, fast proxy",
    description:
      "A small Hono app on Bun. No Express and no Node HTTP stack on the request path. Tokens stream straight through, and request logs never block the client.",
  },
  {
    icon: LockKeyhole,
    title: "Provider vault",
    description:
      "Centralize upstream endpoints and master credentials. Encrypt secrets at rest and keep them out of every application.",
  },
  {
    icon: KeyRound,
    title: "Scoped child keys",
    description:
      "Issue downstream API keys for teams, projects, and apps with tags, rotation, and activation controls.",
  },
  {
    icon: ShieldCheck,
    title: "Policy governance",
    description:
      "Attach model allow-lists, rate limits, and spend budgets before traffic reaches an upstream provider.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Cost & usage analytics",
    description:
      "Attribute tokens, requests, and spend across provider, model, team, project, and key dimensions.",
  },
] as const;

const trustPoints = [
  "Hono on Bun",
  "Streaming pass-through",
  "Encrypted master credentials",
  "Signed child API keys",
] as const;

export const metadata: Metadata = {
  title: {
    absolute: siteTitle,
  },
  description: homeDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    title: siteTitle,
    description: homeDescription,
  },
};

export default async function Home() {
  const session = await getSessionOrNull();
  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: siteName,
        url: siteUrl,
        description: homeDescription,
      },
      {
        "@type": "SoftwareApplication",
        name: siteName,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: homeDescription,
        url: siteUrl,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
    ],
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        {/* Hero */}
        <section className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center">
          <div className="space-y-6">
            <Badge variant="info" className="w-fit">
              Ultra-lightweight · Hono on Bun
            </Badge>
            <div className="space-y-4">
              <h1 className="max-w-2xl font-heading text-[2.25rem] leading-[1.1] font-semibold tracking-[-0.035em] text-text-primary sm:text-[2.75rem]">
                A fast, lightweight gateway for every provider, key, and dollar
                of LLM spend.
              </h1>
              <p className="max-w-xl text-base leading-7 text-text-secondary">
                The proxy is a small Hono app on Bun. Against a local mock it
                adds about 0.16 ms at the median versus calling that mock
                directly, and 0.30 ms at p99. Redis and the model are not in
                that number. Tokens stream straight back. The console is where
                credentials, policies, and spend stay.
              </p>
            </div>
            <dl className="grid max-w-xl grid-cols-3 gap-3">
              {speedFacts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-[11px] font-medium tracking-[0.08em] text-text-tertiary uppercase">
                    {fact.label}
                  </dt>
                  <dd className="mt-1">
                    <span className="block font-heading text-xl font-semibold tracking-[-0.03em] text-text-primary tabular-nums sm:text-2xl">
                      {fact.value}
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-4 text-text-tertiary">
                      {fact.detail}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <Link
                href="/workspace"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                )}
              >
                Open console
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/docs"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                )}
              >
                API docs
              </Link>
              {!session?.user ? (
                <Link
                  href="/sign-in"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                  )}
                >
                  Sign in
                </Link>
              ) : null}
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
              {trustPoints.map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-1.5 text-[13px] text-text-tertiary"
                >
                  <span className="size-1 rounded-full bg-accent" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <Card className="border-border bg-card shadow-card">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium tracking-[0.12em] text-text-tertiary uppercase">
                    Console preview
                  </p>
                  <CardTitle className="mt-1 text-base">
                    Default Workspace
                  </CardTitle>
                </div>
                <Badge variant="success">Live</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {[
                {
                  label: "Providers",
                  value: "6 active",
                  detail: "OpenAI · Anthropic · Azure",
                },
                {
                  label: "Child keys",
                  value: "14 issued",
                  detail: "Teams, projects, applications",
                },
                {
                  label: "7-day spend",
                  value: "$3.48",
                  detail: "Across production & staging",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-2 px-3.5 py-3"
                >
                  <div>
                    <p className="text-[11px] font-medium tracking-[0.08em] text-text-tertiary uppercase">
                      {row.label}
                    </p>
                    <p className="mt-0.5 text-[13px] text-text-secondary">
                      {row.detail}
                    </p>
                  </div>
                  <p className="font-heading text-lg font-semibold tracking-[-0.02em] text-text-primary tabular-nums">
                    {row.value}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Capabilities */}
        <section className="space-y-6">
          <div className="max-w-2xl space-y-2">
            <p className="text-[11px] font-medium tracking-[0.14em] text-text-tertiary uppercase">
              Platform capabilities
            </p>
            <h2 className="font-heading text-xl font-semibold tracking-[-0.03em] text-text-primary sm:text-2xl">
              Light on the hot path. Strict everywhere else.
            </h2>
            <p className="text-sm leading-6 text-text-secondary">
              The data plane stays a thin Hono proxy. The console still governs
              who can call which model, and what it costs.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {capabilities.map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.title}
                  className="border-border bg-card shadow-card"
                >
                  <CardHeader className="gap-3">
                    <div className="flex size-9 items-center justify-center rounded-md border border-border bg-surface-2 text-text-secondary">
                      <Icon className="size-4" aria-hidden />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-sm">{item.title}</CardTitle>
                      <CardDescription className="text-[13px] leading-5">
                        {item.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-xl border border-border bg-card px-6 py-8 shadow-card sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <h2 className="font-heading text-lg font-semibold tracking-[-0.02em] text-text-primary">
                Put a fast proxy in front of your models.
              </h2>
              <p className="max-w-lg text-sm text-text-secondary">
                Connect a provider, register models, and issue a child key. The
                gateway stays a 372 KB Hono app on Bun.
              </p>
            </div>
            <Link
              href="/workspace"
              className={cn(
                buttonVariants({ variant: "default", size: "default" }),
                "shrink-0",
              )}
            >
              Launch workspace
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-[13px] text-text-tertiary sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            {siteName} — {siteTagline}
          </p>
          <nav aria-label="Footer" className="flex flex-wrap gap-4">
            <Link href="/" className="hover:text-text-secondary">
              Product
            </Link>
            <Link href="/about" className="hover:text-text-secondary">
              About
            </Link>
            <Link href="/docs" className="hover:text-text-secondary">
              API docs
            </Link>
            <Link href="/privacy" className="hover:text-text-secondary">
              Privacy
            </Link>
            <Link href="/sign-up" className="hover:text-text-secondary">
              Create account
            </Link>
            <Link href="/workspace" className="hover:text-text-secondary">
              Console
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
