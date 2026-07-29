import getRedisClient, { RedisCacheClient } from "./redis-client";
import {
  App,
  getChildKeyCacheKey,
  getProviderModelCacheKey,
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

export async function invalidate_llm_provider_and_model_cache(
  providerName: string,
  modelAlias: string,
  compatibilityType: string,
  application: App,
  client: RedisCacheClient | null = getRedisClient(),
) {
  const cacheKey = getProviderModelCacheKey(
    providerName,
    modelAlias,
    compatibilityType,
    application,
  );
  return redis_invalidate(cacheKey, client);
}

export async function invalidate_child_key_cache(
  keyId: string,
  client: RedisCacheClient | null = getRedisClient(),
) {
  const cacheKey = getChildKeyCacheKey(keyId);
  return redis_invalidate(cacheKey, client);
}
