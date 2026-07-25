import { getProviders } from "@/app/server-actions/llm-provider/get-providers";
import { ProviderManagementClient } from "@/components/providers/provider-management-client";

export async function ProvidersManagementSection() {
  const providers = await getProviders({ includeInactive: true });

  return <ProviderManagementClient providers={providers} />;
}
