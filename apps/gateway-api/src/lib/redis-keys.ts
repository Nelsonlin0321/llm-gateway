/** Redis Stream used as the request-log buffer before database ingest. */
export const REQUEST_LOG_STREAM = "llm-gateway-request-logs";

export const getChildKeyCacheKey = (keyId: string): string => {
  return `child-key:${keyId}`;
};

export const getProviderModelCacheKey = (params: {
  organizationId: string;
  providerName: string;
  compatibilityType: string;
  modelAlias: string;
}): string => {
  const { organizationId, providerName, compatibilityType, modelAlias } =
    params;
  return `provider-model:${encodeURIComponent(organizationId)}:${encodeURIComponent(
    compatibilityType,
  )}:${encodeURIComponent(providerName)}:${encodeURIComponent(modelAlias)}`;
};

export const getProviderModelCachePattern = (params: {
  organizationId: string;
  providerName: string;
  compatibilityType: string;
}): string => {
  const { organizationId, providerName, compatibilityType } = params;
  return `provider-model:${encodeURIComponent(organizationId)}:${encodeURIComponent(
    compatibilityType,
  )}:${encodeURIComponent(providerName)}:*`;
};

export const getRateLimitKey = (childKeyId: string, windowStartMs: number) =>
  `ratelimit:${childKeyId}:${windowStartMs}`;

