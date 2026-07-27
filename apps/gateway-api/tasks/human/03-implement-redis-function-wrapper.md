create a redis cache wrapper that cache result of a promise function

```ts
export async function redis_cache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = 60 * 60 * 24 * 30,
): Promise<T> {
  const cached = await redis.get(key);
  if (cached !== null && cached !== undefined) {
    //  reconstruct cached result
    return JSON.parse(cached); // need to reconstruct the string of datetime to be datetime object.For example, "2023-01-01T00:00:00.000Z" -> new Date("2023-01-01T00:00:00.000Z")
  }
  //  not cached, call function
  const result = await fn();
  await redis.set(key, JSON.stringify(result), ttl ? { ex: ttl } : {});
  return result;
}
```
