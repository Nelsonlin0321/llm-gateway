import type { ResolveProviderModelResult } from "../providers/resolve";

export type proxyDependencies = {
  resolveProviderModel?: (
    providerId: string,
    modelAlias: string,
    creatorId: string,
  ) => Promise<ResolveProviderModelResult>;
};
