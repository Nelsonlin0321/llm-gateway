/**
 * Added latency of the proxy, with Redis and Postgres out of the path.
 *
 *   overhead = latency(client → gateway → mock) − latency(client → mock)
 *
 * The gateway is the real Hono OpenAI proxy: payload parse, model rewrite,
 * `hono/proxy` forward, and response capture. Child-key JWT verify and the
 * AES decrypts run in memory. Provider resolution returns a fixed record.
 * Nothing connects to Redis or Postgres, so this number does not include
 * Upstash round trips or Neon.
 *
 * Run from apps/gateway-api:
 *   bun scripts/measure-gateway-overhead.ts
 */

import { bodyLimit } from "hono/body-limit";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { SignJWT } from "jose";

import { decryptApiKeyForProxy, encryptApiKey } from "../src/child-keys/crypto";
import { verifyChildKeyToken } from "../src/child-keys/jwt";
import type { ChildKeyDbRecord } from "../src/child-keys/types";
import { requestIdMiddleware } from "../src/request-log/request-id";
import { injectOpenAIProxyContext } from "../src/proxy/proxy-openai";
import { createUpstreamProxyHandler } from "../src/proxy/upstream-proxy";
import type { ResolveProviderModelResult } from "../src/providers/resolve";

process.env.JWT_SIGNING_SECRET ??= "0123456789abcdef0123456789abcdef";
process.env.API_ENCRYPT_KEY ??= "0123456789abcdef";
process.env.NODE_ENV ??= "production";

const SAMPLES = positiveInt(process.env.OVERHEAD_SAMPLES, 300);
const WARMUP = positiveInt(process.env.OVERHEAD_WARMUP, 50);

const REQUEST_BODY = JSON.stringify({
  model: "mock/echo",
  stream: false,
  messages: [{ role: "user", content: "hello" }],
});

const MOCK_RESPONSE = {
  id: "chatcmpl_mock",
  object: "chat.completion",
  choices: [
    {
      index: 0,
      message: { role: "assistant", content: "ok" },
      finish_reason: "stop",
    },
  ],
  usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
};

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function percentile(sorted: number[], p: number): number {
  const index = Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)));
  return sorted[index] ?? 0;
}

function summarize(label: string, samples: number[]) {
  const sorted = [...samples].sort((a, b) => a - b);
  const avg = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;
  return {
    label,
    n: sorted.length,
    avg: round(avg),
    min: round(sorted[0] ?? 0),
    p50: round(percentile(sorted, 0.5)),
    p90: round(percentile(sorted, 0.9)),
    p95: round(percentile(sorted, 0.95)),
    p99: round(percentile(sorted, 0.99)),
    max: round(sorted[sorted.length - 1] ?? 0),
  };
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

async function timePost(url: string, headers: HeadersInit): Promise<number> {
  const started = performance.now();
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: REQUEST_BODY,
  });
  const text = await response.text();
  const elapsed = performance.now() - started;
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}: ${text.slice(0, 240)}`);
  }
  return elapsed;
}

async function main() {
  const secret = new TextEncoder().encode(process.env.JWT_SIGNING_SECRET);
  const plainKey = `sk_${await new SignJWT({
    key_id: "ck_overhead",
    issued_at: 1_700_000_000,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("2h")
    .sign(secret)}`;
  const childKeyCipher = encryptApiKey(plainKey);
  const masterKeyCipher = encryptApiKey("sk-mock-master");

  const childKeyRecord = {
    id: "ck_overhead",
    name: "overhead",
    key: childKeyCipher,
    creatorId: "user_overhead",
    userEmail: "overhead@example.com",
    isActive: true,
    tags: {},
    organizationId: "org_overhead",
    expiresAt: null,
    issuedAt: 1_700_000_000,
    rateLimitRpm: 0,
    monthlyBudgetUsd: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  } satisfies ChildKeyDbRecord;

  const mock = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    fetch() {
      return Response.json(MOCK_RESPONSE);
    },
  });
  const mockOrigin = `http://127.0.0.1:${mock.port}`;

  const resolveProviderModel = async (): Promise<ResolveProviderModelResult> => {
    return {
      ok: true,
      value: {
        providerId: "provider_mock",
        providerName: "mock",
        baseUrl: mockOrigin,
        apiKey: decryptApiKeyForProxy(masterKeyCipher),
        compatibilityType: "openai",
        modelAlias: "echo",
        model: "echo",
        inputPrice: 0,
        outputPrice: 0,
        inputCachePrice: 0,
      },
    };
  };

  const app = new Hono();
  app.use("*", logger());
  app.use("*", requestIdMiddleware);
  app.use("*", secureHeaders());
  app.use("/openai/*", bodyLimit({ maxSize: 1_048_576 }));
  app.use("/openai/*", async (c, next) => {
    await verifyChildKeyToken(plainKey);
    const stored = decryptApiKeyForProxy(childKeyCipher);
    if (!stored.startsWith("sk_")) {
      return c.json({ error: { message: "bad child key" } }, 401);
    }
    if (stored !== plainKey) {
      return c.json({ error: { message: "key mismatch" } }, 401);
    }
    c.set("childKeyRecord", childKeyRecord);
    await next();
  });
  app.post(
    "/openai/*",
    injectOpenAIProxyContext({ resolveProviderModel }),
    createUpstreamProxyHandler({
      emitRequestLog: async () => ({ ok: false, reason: "no_client" }),
    }),
  );

  const gateway = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    fetch: app.fetch,
  });
  const gatewayOrigin = `http://127.0.0.1:${gateway.port}`;

  const directUrl = `${mockOrigin}/v1/chat/completions`;
  const gatewayUrl = `${gatewayOrigin}/openai/v1/chat/completions`;
  const directHeaders = { "content-type": "application/json" };
  const gatewayHeaders = {
    "content-type": "application/json",
    authorization: `Bearer ${plainKey}`,
  };

  try {
    for (let i = 0; i < WARMUP; i++) {
      await timePost(directUrl, directHeaders);
      await timePost(gatewayUrl, gatewayHeaders);
    }

    const direct: number[] = [];
    const viaGateway: number[] = [];
    const overhead: number[] = [];
    for (let i = 0; i < SAMPLES; i++) {
      const directMs = await timePost(directUrl, directHeaders);
      const gatewayMs = await timePost(gatewayUrl, gatewayHeaders);
      direct.push(directMs);
      viaGateway.push(gatewayMs);
      overhead.push(gatewayMs - directMs);
    }

    console.log(
      JSON.stringify(
        {
          formula:
            "overhead = latency(client -> gateway -> mock) - latency(client -> mock)",
          excluded: ["redis", "postgres", "upstream model"],
          included: [
            "hono middleware",
            "in-memory HS256 verify",
            "in-memory AES-256-GCM decrypt of child key and master key",
            "openai payload parse and model rewrite",
            "proxy fetch to local mock",
            "JSON response capture",
          ],
          samples: SAMPLES,
          warmup: WARMUP,
          mock: mockOrigin,
          gateway: gatewayOrigin,
          direct: summarize("client -> mock", direct),
          viaGateway: summarize("client -> gateway -> mock", viaGateway),
          overhead: summarize("paired difference", overhead),
        },
        null,
        2,
      ),
    );
  } finally {
    gateway.stop(true);
    mock.stop(true);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
