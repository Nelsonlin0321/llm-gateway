type App = "gateway-api" | "gateway-portal" | "";

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
  application: App;
}): string => {
  const { providerName, compatibilityType, modelAlias, application } = params;
  return `provider-model:${encodeURIComponent(
    providerName,
  )}:${encodeURIComponent(compatibilityType)}:${encodeURIComponent(modelAlias)}:${application}`;
};
