import type { Metadata } from "next";

export const siteName = "llm-gateway.io";
export const siteTagline = "Open Source LLM Gateway with Control Plane";
export const siteTitle =
  "Open LLM Gateway — Open Source LLM Gateway with Control Plane";
export const siteDescription =
  "Open Source LLM Gateway with Control Plane — Enterprise control plane for LLM providers, child API keys, policy governance, and usage analytics.";

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
