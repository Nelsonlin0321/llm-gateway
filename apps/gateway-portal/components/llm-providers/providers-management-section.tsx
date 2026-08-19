import { getProviders } from "@/app/server-actions/llm-provider/get-providers";
import { ProviderManagementClient } from "@/components/llm-providers/provider-management-client";
import type { ProviderListQuery } from "@/lib/llm-provider/schema";

export async function ProvidersManagementSection({
  query,
}: {
  query?: ProviderListQuery;
}) {
  const providers = await getProviders({
    includeInactive: true,
    ...query,
  });

  return (
    <ProviderManagementClient providers={providers} query={query ?? {}} />
  );
}
