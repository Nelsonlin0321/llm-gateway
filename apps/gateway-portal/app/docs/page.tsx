import type { Metadata } from "next";
import Link from "next/link";

import { ApiDocsContent } from "@/components/docs/api-docs-content";
import { Badge } from "@/components/ui/badge";
import {
  ANTHROPIC_PREFIX,
  OPENAI_PREFIX,
  PROXY_API_URL_ENV,
  getProxyApiUrl,
  proxyApiUrlForExamples,
} from "@/lib/docs/api-guide";
import { getSiteUrl, serializeJsonLd, siteName } from "@/lib/site";

const title = "How to use the Open LLM Gateway API";
const description =
  "Call any OpenAI- or Anthropic-compatible route through Open LLM Gateway using a child API key and provider/alias model IDs.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/docs",
  },
  openGraph: {
    url: "/docs",
    title,
    description,
  },
};

export default function DocsPage() {
  const siteUrl = getSiteUrl();
  const proxyUrl = proxyApiUrlForExamples();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: title,
    description,
    url: `${siteUrl}/docs`,
    author: {
      "@type": "Organization",
      name: siteName,
    },
    about: [
      `${proxyUrl}${OPENAI_PREFIX}/*`,
      `${proxyUrl}${ANTHROPIC_PREFIX}/*`,
    ],
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header className="space-y-4 border-b border-border pb-8">
          <Badge variant="info" className="w-fit">
            API
          </Badge>
          <div className="space-y-3">
            <h1 className="max-w-3xl font-heading text-[2rem] leading-[1.1] font-semibold tracking-[-0.035em] text-text-primary sm:text-[2.35rem]">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-text-secondary">
              {description}{" "}
              <code className="font-mono text-[13px] text-text-primary">
                {`POST ${OPENAI_PREFIX}/*`}
              </code>{" "}
              and{" "}
              <code className="font-mono text-[13px] text-text-primary">
                {`POST ${ANTHROPIC_PREFIX}/*`}
              </code>{" "}
              proxy whatever the upstream LLM provider supports.
            </p>
          </div>
          <p className="text-[13px] text-text-tertiary">
            Gateway origin is{" "}
            <code className="font-mono text-text-secondary">
              {PROXY_API_URL_ENV}
            </code>
            {getProxyApiUrl() ? (
              <>
                {" "}
                (
                <code className="font-mono text-text-secondary">
                  {proxyUrl}
                </code>
                )
              </>
            ) : null}
            .{" "}
            <Link href="/workspace" className="text-accent hover:underline">
              Mint a child key
            </Link>
            .
          </p>
        </header>

        <ApiDocsContent />
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-[13px] text-text-tertiary sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>{siteName} API — OpenAI- and Anthropic-compatible proxy</p>
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
