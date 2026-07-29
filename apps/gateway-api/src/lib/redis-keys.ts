export const getChildKeyCacheKey = (keyId: string): string => {
  return `child-key:${keyId}`;
};

export const getProviderModelCacheKey = (
  providerName: string,
  modelAlias: string,
  compatibilityType: string,
  application: string = "gateway-api",
): string => {
  return `provider-model:${application}:${encodeURIComponent(compatibilityType)}:${encodeURIComponent(
    providerName,
  )}:${encodeURIComponent(modelAlias)}`;
};
