import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { getSiteUrl, serializeJsonLd, siteName } from "@/lib/site";

const title = "Privacy Policy";
const description =
  "Learn what llm-gateway.io collects, how data is used, and how we protect account, provider, and usage information.";

const sections = [
  {
    title: "Information we collect",
    points: [
      "Account details such as name, email address, and organization membership.",
      "Workspace configuration such as provider names, model aliases, child keys, and related settings.",
      "Operational and usage data such as requests, token counts, spend metadata, timestamps, and audit events.",
    ],
  },
  {
    title: "How we use information",
    points: [
      "To authenticate users, operate workspaces, and enforce permissions.",
      "To route requests to upstream providers, issue child API keys, and support analytics and billing visibility.",
      "To monitor reliability, investigate abuse, improve the product, and maintain security controls.",
    ],
  },
  {
    title: "Provider and request data",
    points: [
      "When you use the gateway, request data may be transmitted to the upstream provider you configure.",
      "Your upstream providers process data under their own terms and privacy practices.",
      "We recommend that you avoid sending sensitive personal data unless your own policies and provider agreements allow it.",
    ],
  },
  {
    title: "Security and retention",
    points: [
      "We use access controls and encrypted secret storage to protect provider credentials and related configuration.",
      "We retain data for as long as needed to operate the service, meet legal obligations, resolve disputes, and enforce agreements.",
      "Retention periods may vary by data type, environment, and customer requirements.",
    ],
  },
  {
    title: "Your choices",
    points: [
      "You can update profile information and manage workspace resources from the console.",
      "You can remove providers, models, and child keys when they are no longer needed.",
      "If you need help with privacy-related requests, contact the team using the project links below.",
    ],
  },
] as const;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    url: "/privacy",
    title,
    description,
  },
};

export default function PrivacyPage() {
  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: `${siteUrl}/privacy`,
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header className="space-y-4 border-b border-border pb-8">
          <Badge variant="info" className="w-fit">
            Legal
          </Badge>
          <div className="space-y-3">
            <h1 className="font-heading text-[2rem] leading-[1.1] font-semibold tracking-[-0.035em] text-text-primary sm:text-[2.35rem]">
              {title}
            </h1>
            <p className="max-w-3xl text-base leading-7 text-text-secondary">
              This page explains how {siteName} handles account information,
              workspace configuration, and service usage data.
            </p>
          </div>
        </header>

        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="font-heading text-xl font-semibold tracking-[-0.02em] text-text-primary">
                {section.title}
              </h2>
              <ul className="space-y-2 text-sm leading-6 text-text-secondary">
                {section.points.map((point) => (
                  <li key={point} className="flex gap-2.5">
                    <span
                      aria-hidden
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-accent"
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-[13px] text-text-tertiary sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>{siteName} privacy information</p>
          <nav aria-label="Footer" className="flex flex-wrap gap-4">
            <Link href="/" className="hover:text-text-secondary">
              Product
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
