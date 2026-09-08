import { Redis } from "@upstash/redis/cloudflare";

import type { WorkerBindings } from "../env";

/**
 * Minimal Redis surface used by the stream consumer.
 * Compatible with the previous ioredis calling convention; tests inject fakes.
 */
export interface RedisStreamClient {
  /**
   * XGROUP — manage a consumer group on a stream.
   * Ingest only uses CREATE (MKSTREAM). BUSYGROUP means the group already exists.
   *
   * @example
   * ```
   * xgroup("CREATE", "llm-gateway-request-logs", "gateway-ingest", "0", "MKSTREAM")
   * // Redis: XGROUP CREATE llm-gateway-request-logs gateway-ingest 0 MKSTREAM
   * ```
   * - `CREATE` — subcommand; this client rejects any other XGROUP action
   * - `llm-gateway-request-logs` — stream key
   * - `gateway-ingest` — consumer group name (PEL + XACK are scoped to this)
   * - `0` — start id: members may read existing entries from the beginning
   *   (`$` would mean only messages added after group creation)
   * - `MKSTREAM` — create the stream if it does not exist yet
   */
  xgroup(
    ...args: (string | number)[]
  ): Promise<string | number | null>;
  /**
   * XREADGROUP — read never-delivered stream entries as a group consumer.
   * `>` is the never-delivered cursor (first delivery; Redis PEL count = 1).
   *
   * @example
   * ```
   * xreadgroup("GROUP", "gateway-ingest", "gateway-ingest-worker", "COUNT", 20, "STREAMS", "llm-gateway-request-logs", ">")
   * // Redis: XREADGROUP GROUP gateway-ingest gateway-ingest-worker COUNT 20 STREAMS llm-gateway-request-logs >
   * ```
   * - `GROUP` — token introducing group + consumer
   * - `gateway-ingest` — consumer group
   * - `gateway-ingest-worker` — this worker's consumer name
   * - `COUNT` `20` — max entries to return
   * - `BLOCK` `ms` — optional; omitted when `blockMs` is 0 (Upstash REST cannot BLOCK)
   * - `STREAMS` — token introducing stream list
   * - `llm-gateway-request-logs` — stream key
   * - `>` — only messages never delivered to this group
   */
  xreadgroup(
    ...args: (string | number | Buffer)[]
  ): Promise<XReadGroupResult | null>;
  /**
   * XAUTOCLAIM — reclaim idle pending entries from the group's PEL (Redis 6.2+).
   * Redis increments PEL delivery count on each successful claim.
   * The reply has no count; call `xpending` to read it.
   *
   * @example
   * ```
   * xautoclaim("llm-gateway-request-logs", "gateway-ingest", "gateway-ingest-worker", 60000, "0-0", "COUNT", 20)
   * // Redis: XAUTOCLAIM llm-gateway-request-logs gateway-ingest gateway-ingest-worker 60000 0-0 COUNT 20
   * ```
   * - `llm-gateway-request-logs` — stream key
   * - `gateway-ingest` — consumer group whose PEL is scanned
   * - `gateway-ingest-worker` — consumer that will own the claimed entries
   * - `60000` — min-idle-ms; only pending entries idle at least this long
   * - `0-0` — PEL scan cursor (`0-0` starts/wraps; pass the previous next-id to page)
   * - `COUNT` `20` — max entries to claim this call
   */
  xautoclaim(
    ...args: (string | number | Buffer)[]
  ): Promise<XAutoClaimResult>;
  /**
   * XACK — acknowledge ids so they leave the group's PEL and will not be reclaimed.
   * Returns how many of the given ids were actually acknowledged.
   *
   * @example
   * ```
   * xack("llm-gateway-request-logs", "gateway-ingest", "1710000000000-0", "1710000000001-0")
   * // Redis: XACK llm-gateway-request-logs gateway-ingest 1710000000000-0 1710000000001-0
   * ```
   * - `key` — stream key
   * - `group` — consumer group
   * - `ids` — stream entry ids to remove from the PEL (e.g. `1710000000000-0`)
   */
  xack(
    key: string,
    group: string,
    ...ids: string[]
  ): Promise<number>;
  /**
   * XPENDING (ranged) — inspect the PEL. Each row is
   * `[id, consumer, idleMs, deliveryCount]`. `deliveryCount` is Redis's
   * times-delivered counter (persisted in Redis, not Worker memory).
   *
   * @example
   * ```
   * xpending("llm-gateway-request-logs", "gateway-ingest", "1-0", "2-0", 2, "gateway-ingest-worker")
   * // Redis: XPENDING llm-gateway-request-logs gateway-ingest 1-0 2-0 2 gateway-ingest-worker
   * // Reply: [["1-0", "gateway-ingest-worker", 60000, 4], ["2-0", "gateway-ingest-worker", 1200, 2]]
   * ```
   * - `key` — stream key
   * - `group` — consumer group
   * - `start` / `end` — inclusive stream-id range to scan (claimed batch first/last id)
   * - `count` — max PEL rows to return
   * - `consumer` — optional; limit to this consumer's pending entries
   */
  xpending(
    key: string,
    group: string,
    start: string,
    end: string,
    count: number,
    consumer?: string,
  ): Promise<XPendingResult>;
  /**
   * XADD — append an entry to a stream.
   *
   * @example
   * ```
   * xadd("llm-gateway-request-logs", "*", "event_id", "evt-1", "request_id", "req-1")
   * // Redis: XADD llm-gateway-request-logs * event_id evt-1 request_id req-1
   * ```
   * - `key` — stream key
   * - remaining args — optional `MAXLEN [~|=] n`, then entry `id` (`*` = auto-id),
   *   then field/value pairs
   */
  xadd(key: string, ...args: (string | Buffer | number)[]): Promise<string>;
  /**
   * PING — connectivity check; Redis replies `PONG`.
   *
   * @example
   * ```
   * await ping() // "PONG"
   * ```
   */
  ping(): Promise<string>;
  /**
   * Close the client. HTTP REST has no socket; returns `OK` without a network call.
   *
   * @example
   * ```
   * await quit() // "OK"
   * ```
   */
  quit(): Promise<"OK">;
  /**
   * Drop the client without waiting. HTTP REST has no socket; no-op.
   *
   * @example
   * ```
   * disconnect()
   * ```
   */
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

/**
 * One ranged-XPENDING row:
 * `[ id, consumer, idle-ms, delivery-count ]`
 */
export type XPendingEntry = [
  id: string,
  consumer: string,
  idleMs: number,
  deliveryCount: number,
];

export type XPendingResult = XPendingEntry[];

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

  async xpending(
    key: string,
    group: string,
    start: string,
    end: string,
    count: number,
    consumer?: string,
  ): Promise<XPendingResult> {
    const raw = await this.redis.xpending(
      key,
      group,
      start,
      end,
      count,
      consumer ? { consumer } : undefined,
    );
    return parseXPendingResult(raw);
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

/**
 * Normalize an XPENDING range reply into `[id, consumer, idleMs, deliveryCount]`.
 */
export function parseXPendingResult(raw: unknown): XPendingResult {
  if (!Array.isArray(raw)) {
    return [];
  }

  const entries: XPendingResult = [];
  for (const row of raw) {
    if (!Array.isArray(row) || row.length < 4) {
      continue;
    }
    const id = row[0];
    const consumer = row[1];
    const idleMs = Number(row[2]);
    const deliveryCount = Number(row[3]);
    if (typeof id !== "string" || !Number.isFinite(deliveryCount)) {
      continue;
    }
    entries.push([
      id,
      typeof consumer === "string" ? consumer : String(consumer ?? ""),
      Number.isFinite(idleMs) ? idleMs : 0,
      deliveryCount,
    ]);
  }
  return entries;
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
