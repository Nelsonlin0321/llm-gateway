import type { Metadata } from "next";

export const siteName = "Gateway";
export const siteTagline = "LLM Control Plane";
export const siteTitle = "Gateway — LLM Control Plane";
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
