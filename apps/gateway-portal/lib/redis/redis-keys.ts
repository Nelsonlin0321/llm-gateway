export type App = "gateway-api" | "gateway-portal" | "both";

export const getChildKeyCacheKey = (
  keyId: string,
  application: App = "both",
): string => {
  return `child-key:${application}:${keyId}`;
};

export const getProviderModelCacheKey = (
  providerName: string,
  modelAlias: string,
  compatibilityType: string,
  application: App,
): string => {
  return `provider-model:${application}:${encodeURIComponent(compatibilityType)}:${encodeURIComponent(
    providerName,
  )}:${encodeURIComponent(modelAlias)}`;
};
