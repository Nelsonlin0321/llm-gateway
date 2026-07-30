type App = "gateway-api" | "gateway-portal" | "";

/** Redis Stream used as the request-log buffer before database ingest. */
export const REQUEST_LOG_STREAM = "llm-gateway-request-logs";

export const getChildKeyCacheKey = (
  keyId: string,
  application: App,
): string => {
  return `child-key:${application}:${keyId}`;
};

export const getProviderModelCacheKey = (params: {
  providerName: string;
  compatibilityType: string;
  modelAlias: string;
  creatorId: string;
  application: App;
}): string => {
  const {
    providerName,
    compatibilityType,
    modelAlias,
    creatorId,
    application,
  } = params;
  return `provider-model:${encodeURIComponent(
    providerName,
  )}:${encodeURIComponent(compatibilityType)}:${encodeURIComponent(
    creatorId,
  )}:${encodeURIComponent(modelAlias)}:${application}`;
};
