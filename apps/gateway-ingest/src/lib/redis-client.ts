import { Redis } from "@upstash/redis/cloudflare";

import type { WorkerBindings } from "../env";

/**
 * Minimal Redis surface used by the stream consumer.
 * Compatible with the previous ioredis calling convention; tests inject fakes.
 */
export interface RedisStreamClient {
  xgroup(
    ...args: (string | number)[]
  ): Promise<string | number | null>;
  xreadgroup(
    ...args: (string | number | Buffer)[]
  ): Promise<XReadGroupResult | null>;
  xautoclaim(
    ...args: (string | number | Buffer)[]
  ): Promise<XAutoClaimResult>;
  xack(
    key: string,
    group: string,
    ...ids: string[]
  ): Promise<number>;
  xadd(key: string, ...args: (string | Buffer | number)[]): Promise<string>;
  ping(): Promise<string>;
  quit(): Promise<"OK">;
  disconnect(): void;
}

/**
 * ioredis / Redis RESP shape for XREADGROUP replies:
 * [ [ streamKey, [ [ id, [ field, value, ... ] ], ... ] ], ... ]
 */
export type XReadGroupResult = Array<
  [streamKey: string, entries: Array<[id: string, fields: string[] | null]>]
>;

/**
 * ioredis / Redis RESP shape for XAUTOCLAIM replies:
 * [ nextStartId, [ [ id, fields | null ], ... ], [ deletedIds? ] ]
 */
export type XAutoClaimResult = [
  nextStartId: string,
  entries: Array<[id: string, fields: string[] | null]>,
  deletedIds?: string[],
];

export type RedisRestCredentials = {
  url: string;
  token: string;
};

/**
 * Resolve HTTP Redis credentials for Cloudflare Workers.
 *
 * Prefers explicit Upstash REST bindings; otherwise derives
 * `https://<host>` + password from `REDIS_URL` (Upstash TCP URL).
 */
export function resolveRedisRest(
  env: WorkerBindings = process.env,
): RedisRestCredentials | null {
  const restUrl = (env.UPSTASH_REDIS_REST_URL ?? "").trim();
  const restToken = (env.UPSTASH_REDIS_REST_TOKEN ?? "").trim();
  if (restUrl && restToken) {
    return { url: restUrl, token: restToken };
  }

  const redisUrl = (env.REDIS_URL ?? "").trim();
  if (!redisUrl) {
    return null;
  }

  try {
    const parsed = new URL(redisUrl);
    const token = decodeURIComponent(parsed.password);
    if (!parsed.hostname || !token) {
      return null;
    }
    return { url: `https://${parsed.hostname}`, token };
  } catch {
    return null;
  }
}

class UpstashRedisStreamClient implements RedisStreamClient {
  private readonly redis: Redis;

  constructor(credentials: RedisRestCredentials) {
    this.redis = new Redis({
      url: credentials.url,
      token: credentials.token,
      automaticDeserialization: false,
    });
  }

  async ping(): Promise<string> {
    return this.redis.ping();
  }

  async quit(): Promise<"OK"> {
    return "OK";
  }

  disconnect(): void {
    // HTTP REST client has no socket to close.
  }

  async xgroup(...args: (string | number)[]): Promise<string | number | null> {
    const strArgs = args.map(String);
    const action = strArgs[0]?.toUpperCase();
    if (action !== "CREATE") {
      throw new Error(`Unsupported XGROUP action: ${strArgs[0] ?? ""}`);
    }

    const key = strArgs[1] ?? "";
    const group = strArgs[2] ?? "";
    const id = strArgs[3] ?? "0";
    const mkstream = strArgs.includes("MKSTREAM");

    return this.redis.xgroup(key, {
      type: "CREATE",
      group,
      id,
      options: mkstream ? { MKSTREAM: true } : undefined,
    });
  }

  async xreadgroup(
    ...args: (string | number | Buffer)[]
  ): Promise<XReadGroupResult | null> {
    const parsed = parseXReadGroupArgs(args);
    const result = await this.redis.xreadgroup(
      parsed.group,
      parsed.consumer,
      parsed.streamKey,
      parsed.id,
      {
        count: parsed.count,
        // Upstash REST does not support BLOCK; consume-loop treats
        // empty non-blocking reads as drain-complete.
      },
    );

    if (result == null) {
      return null;
    }
    return result as XReadGroupResult;
  }

  async xautoclaim(
    ...args: (string | number | Buffer)[]
  ): Promise<XAutoClaimResult> {
    const parsed = parseXAutoClaimArgs(args);
    const result = await this.redis.xautoclaim(
      parsed.streamKey,
      parsed.group,
      parsed.consumer,
      parsed.minIdleMs,
      parsed.startId,
      parsed.count !== undefined ? { count: parsed.count } : undefined,
    );
    return result as XAutoClaimResult;
  }

  async xack(key: string, group: string, ...ids: string[]): Promise<number> {
    return this.redis.xack(key, group, ids);
  }

  async xadd(
    key: string,
    ...args: (string | Buffer | number)[]
  ): Promise<string> {
    const strArgs = args.map(String);
    let i = 0;
    let opts:
      | {
          trim: {
            type: "MAXLEN";
            threshold: number;
            comparison: "=" | "~";
          };
        }
      | undefined;

    if (strArgs[i] === "MAXLEN") {
      i += 1;
      let comparison: "=" | "~" = "=";
      if (strArgs[i] === "~" || strArgs[i] === "=") {
        comparison = strArgs[i] as "=" | "~";
        i += 1;
      }
      const threshold = Number(strArgs[i]);
      i += 1;
      opts = {
        trim: { type: "MAXLEN", threshold, comparison },
      };
    }

    const id = strArgs[i] ?? "*";
    i += 1;
    const entries: Record<string, string> = {};
    for (; i < strArgs.length; i += 2) {
      const field = strArgs[i];
      if (!field) {
        continue;
      }
      entries[field] = strArgs[i + 1] ?? "";
    }

    return this.redis.xadd(key, id, entries, opts);
  }
}

function parseXReadGroupArgs(args: (string | number | Buffer)[]): {
  group: string;
  consumer: string;
  streamKey: string;
  id: string;
  count?: number;
} {
  const strArgs = args.map(String);
  let i = 0;
  if (strArgs[i]?.toUpperCase() === "GROUP") {
    i += 1;
  }
  const group = strArgs[i++] ?? "";
  const consumer = strArgs[i++] ?? "";
  let count: number | undefined;

  while (i < strArgs.length) {
    const token = strArgs[i]?.toUpperCase();
    if (token === "COUNT") {
      i += 1;
      count = Number(strArgs[i++]);
      continue;
    }
    if (token === "BLOCK") {
      i += 2;
      continue;
    }
    if (token === "STREAMS") {
      i += 1;
      break;
    }
    i += 1;
  }

  const streamKey = strArgs[i++] ?? "";
  const id = strArgs[i] ?? ">";
  return { group, consumer, streamKey, id, count };
}

function parseXAutoClaimArgs(args: (string | number | Buffer)[]): {
  streamKey: string;
  group: string;
  consumer: string;
  minIdleMs: number;
  startId: string;
  count?: number;
} {
  const strArgs = args.map(String);
  const streamKey = strArgs[0] ?? "";
  const group = strArgs[1] ?? "";
  const consumer = strArgs[2] ?? "";
  const minIdleMs = Number(strArgs[3] ?? 0);
  const startId = strArgs[4] ?? "0-0";
  let count: number | undefined;
  const countIdx = strArgs.findIndex((value) => value.toUpperCase() === "COUNT");
  if (countIdx >= 0) {
    count = Number(strArgs[countIdx + 1]);
  }
  return { streamKey, group, consumer, minIdleMs, startId, count };
}

let redisClient: RedisStreamClient | null | undefined;

export function createRedisClient(
  credentials: RedisRestCredentials,
): RedisStreamClient {
  return new UpstashRedisStreamClient(credentials);
}

export function getRedisClient(
  env: WorkerBindings = process.env,
): RedisStreamClient | null {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const credentials = resolveRedisRest(env);
  redisClient = credentials ? createRedisClient(credentials) : null;
  return redisClient;
}

/** Reset singleton (tests). */
export function resetRedisClient(): void {
  redisClient = undefined;
}

export default getRedisClient;
