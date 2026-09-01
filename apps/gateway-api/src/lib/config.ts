export type GatewayConfig = {
  port: number;
  databaseUrl: string;
  jwtSigningSecret: string;
  apiEncryptKey: string;
  redisUrl: string | null;
  requestBodyLimitBytes: number;
  upstreamTimeoutMs: number;
  /** Default child-key requests per minute. 0 disables. */
  defaultRateLimitRpm: number;
  corsOrigins: string[];
};

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
}

function requireSecret(
  name: string,
  value: string,
  minLength: number,
): string {
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  if (value.length < minLength) {
    throw new Error(`${name} must be at least ${minLength} characters.`);
  }
  return value;
}

/**
 * Load and validate gateway-api process config.
 * Skips hard secret checks when `NODE_ENV=test` so unit tests can import modules.
 */
export function loadGatewayConfig(
  env: NodeJS.ProcessEnv = process.env,
): GatewayConfig {
  const isTest = env.NODE_ENV === "test";
  const databaseUrl = (env.DATABASE_URL ?? "").trim();
  const jwtSigningSecret = (env.JWT_SIGNING_SECRET ?? "").trim();
  const apiEncryptKey = (env.API_ENCRYPT_KEY ?? "").trim();
  const redisUrl = (env.REDIS_URL ?? "").trim() || null;

  if (!isTest) {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required.");
    }
    requireSecret("JWT_SIGNING_SECRET", jwtSigningSecret, 32);
    requireSecret("API_ENCRYPT_KEY", apiEncryptKey, 16);
  }

  const corsOrigins = (env.GATEWAY_CORS_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  return {
    port: parsePositiveInt(env.PORT, 8080) || 8080,
    databaseUrl,
    jwtSigningSecret,
    apiEncryptKey,
    redisUrl,
    requestBodyLimitBytes: parsePositiveInt(
      env.REQUEST_BODY_LIMIT_BYTES,
      1_048_576,
    ),
    upstreamTimeoutMs: parsePositiveInt(env.UPSTREAM_TIMEOUT_MS, 120_000),
    defaultRateLimitRpm: parsePositiveInt(env.CHILD_KEY_RATE_LIMIT_RPM, 600),
    corsOrigins,
  };
}
