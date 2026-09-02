import Redis from "ioredis";

/**
 * Minimal Redis surface used by the stream consumer.
 * Compatible with ioredis; tests inject fakes.
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
  quit(): Promise<"OK">;
  disconnect(): void;
}

/**
 * ioredis shape for XREADGROUP replies:
 * [ [ streamKey, [ [ id, [ field, value, ... ] ], ... ] ], ... ]
 */
export type XReadGroupResult = Array<
  [streamKey: string, entries: Array<[id: string, fields: string[] | null]>]
>;

/**
 * ioredis shape for XAUTOCLAIM replies:
 * [ nextStartId, [ [ id, fields | null ], ... ], [ deletedIds? ] ]
 */
export type XAutoClaimResult = [
  nextStartId: string,
  entries: Array<[id: string, fields: string[] | null]>,
  deletedIds?: string[],
];

let redisClient: RedisStreamClient | null | undefined;

/**
 * Create (or return cached) Redis client from `REDIS_URL`.
 * Pass `url` to override; used by tests and startup.
 */
export function createRedisClient(url: string): RedisStreamClient {
  return new Redis(url) as unknown as RedisStreamClient;
}

export function getRedisClient(
  url?: string,
): RedisStreamClient | null {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const resolved = (url ?? process.env.REDIS_URL ?? "").trim();
  redisClient = resolved ? createRedisClient(resolved) : null;
  return redisClient;
}

/** Reset singleton (tests). */
export function resetRedisClient(): void {
  redisClient = undefined;
}

export default getRedisClient;
