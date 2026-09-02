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
