import type { Metadata } from "next";

export const siteName = "llm-gateway.io";
export const siteTagline = "LLM Gateway Control Plane";
export const siteTitle = "LLM Gateway — Open Source LLM Control Plane";
export const siteDescription =
  "Enterprise control plane for LLM providers, child API keys, policy governance, and usage analytics.";

export function getSiteUrl(): string {
  const raw = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

export const noIndexRobots = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
} satisfies NonNullable<Metadata["robots"]>;

export function privatePageMetadata(
  title: string,
  description: string,
): Metadata {
  return {
    title,
    description,
    robots: noIndexRobots,
  };
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
