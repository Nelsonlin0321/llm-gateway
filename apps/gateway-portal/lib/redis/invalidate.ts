import getRedisClient, { RedisCacheClient } from "./redis-client";
import {
  getChildKeyCacheKey,
  getProviderModelCachePattern,
} from "./redis-keys";

export async function redis_invalidate(
  key: string,
  client: RedisCacheClient | null = getRedisClient(),
): Promise<boolean> {
  if (!client) {
    return false;
  }

  try {
    const deleted = await client.del(key);
    return deleted > 0;
  } catch {
    return false;
  }
}

export async function redis_invalidate_pattern(
  pattern: string,
  client: RedisCacheClient | null = getRedisClient(),
): Promise<number> {
  if (!client) {
    return 0;
  }

  let deletedTotal = 0;

  try {
    let cursor = "0";

    do {
      const [nextCursor, keys] = await client.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        1000,
      );
      cursor = nextCursor;

      if (keys.length > 0) {
        deletedTotal += await client.del(...keys);
      }
    } while (cursor !== "0");
  } catch {
    return 0;
  }

  return deletedTotal;
}

export async function invalidate_llm_provider_and_model_cache(
  organizationId: string,
  providerName: string,
  compatibilityType: string,
  client: RedisCacheClient | null = getRedisClient(),
) {
  return redis_invalidate_pattern(
    getProviderModelCachePattern({
      organizationId,
      providerName,
      compatibilityType,
    }),
    client,
  );
}

export async function invalidate_child_key_cache(
  keyId: string,
  client: RedisCacheClient | null = getRedisClient(),
) {
  const cacheKey = getChildKeyCacheKey(keyId);
  return redis_invalidate(cacheKey, client);
}
