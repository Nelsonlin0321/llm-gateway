import { getProviders } from "@/app/server-actions/llm-provider/get-providers";
import { ProviderManagementClient } from "@/components/llm-providers/provider-management-client";
import { requireSession } from "@/lib/auth-server";
import type { ProviderListQuery } from "@/lib/llm-provider/schema";
import { getOrganizationRole } from "@/lib/organization/access";

type ProvidersManagementSectionProps = {
  organizationId: string;
  query?: ProviderListQuery;
};

export async function ProvidersManagementSection({
  organizationId,
  query = {},
}: ProvidersManagementSectionProps) {
  const session = await requireSession();
  const role = await getOrganizationRole(session.user.id, organizationId);
  const providers = await getProviders({
    organizationId,
    includeInactive: true,
    ...query,
  });

  return (
    <ProviderManagementClient
      organizationId={organizationId}
      providers={providers}
      query={query}
      role={role}
    />
  );
}
