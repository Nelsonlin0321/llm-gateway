import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Boxes, GitBranch, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSiteUrl, serializeJsonLd, siteName } from "@/lib/site";
import { cn } from "@/lib/utils";

const title = "About llm-gateway.io";
const description =
  "llm-gateway.io is a self-hosted, open source open LLM gateway for routing models, managing keys, enforcing policy, and tracking usage across providers.";

const pillars = [
  {
    icon: Boxes,
    title: "One gateway, many providers",
    description:
      "Connect OpenAI-, Anthropic-, and compatible upstreams behind one consistent control plane and model namespace.",
  },
  {
    icon: ShieldCheck,
    title: "Self-hosted control",
    description:
      "Run the gateway in your own environment so credentials, policies, and operational decisions stay under your control.",
  },
  {
    icon: GitBranch,
    title: "Open source foundation",
    description:
      "Use the codebase as-is, extend it for your own workflows, and keep the platform transparent instead of depending on a closed black box.",
  },
] as const;

const highlights = [
  "Self-hosted open LLM gateway",
  "Open source codebase on GitHub",
  "Provider, model, and child key management",
  "Usage analytics and spend visibility",
  "Policy controls before upstream calls",
] as const;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    url: "/about",
    title,
    description,
  },
};

export default function AboutPage() {
  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: title,
    description,
    url: `${siteUrl}/about`,
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header className="space-y-5 border-b border-border pb-8">
          <Badge variant="info" className="w-fit">
            About
          </Badge>
          <div className="space-y-4">
            <h1 className="max-w-4xl font-heading text-[2rem] leading-[1.1] font-semibold tracking-[-0.035em] text-text-primary sm:text-[2.45rem]">
              {siteName} is a self-hosted open source open LLM gateway.
            </h1>
            <p className="max-w-3xl text-base leading-7 text-text-secondary">
              It gives teams one place to connect upstream model providers,
              issue child keys, register model aliases, apply governance, and
              track usage across environments. The goal is simple: keep the
              gateway layer open, portable, and under your control.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <Link
              href="https://github.com/Nelsonlin0321/llm-gateway"
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "default", size: "lg" }))}
            >
              View on GitHub
              <ArrowUpRight className="size-4" />
            </Link>
            <Link
              href="/docs"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Read the docs
            </Link>
            <Link
              href="/workspace"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Open console
            </Link>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;

            return (
              <Card key={pillar.title} className="border-border bg-card shadow-card">
                <CardHeader className="space-y-3 border-b border-border">
                  <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-surface-2 text-text-primary">
                    <Icon className="size-4.5" />
                  </span>
                  <CardTitle className="text-base">{pillar.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 text-sm leading-6 text-text-secondary">
                  {pillar.description}
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-semibold tracking-[-0.02em] text-text-primary">
              Why this project exists
            </h2>
            <div className="space-y-3 text-sm leading-7 text-text-secondary">
              <p>
                Teams adopting LLMs usually end up duplicating provider
                credentials across apps, scattering API keys across
                environments, and losing visibility into which models are being
                used and what they cost.
              </p>
              <p>
                llm-gateway.io puts a shared gateway in front of those upstream
                providers. That lets platform teams standardize routing,
                centralize secrets, issue scoped child keys, and add policy and
                analytics without forcing every application to rebuild the same
                infrastructure.
              </p>
              <p>
                Because it is open source and self-hosted, you can inspect the
                system, adapt it to your environment, and keep ownership of the
                operational layer between your applications and model vendors.
              </p>
            </div>
          </div>

          <Card className="border-border bg-card shadow-card">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-base">What it includes</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-3 text-sm leading-6 text-text-secondary">
                {highlights.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span
                      aria-hidden
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-accent"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-[13px] text-text-tertiary sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>{siteName} about page</p>
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
            <Link href="/workspace" className="hover:text-text-secondary">
              Console
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
