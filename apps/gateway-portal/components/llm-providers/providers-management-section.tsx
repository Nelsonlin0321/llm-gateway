import { getProviders } from "@/app/server-actions/llm-provider/get-providers";
import { ProviderManagementClient } from "@/components/llm-providers/provider-management-client";
import { requireSession } from "@/lib/auth-server";
import type { ProviderListQuery } from "@/lib/llm-provider/schema";
import { getOrganizationRole } from "@/lib/organization/access";
import { resolveActiveOrganizationId } from "@/lib/organization/service";

export async function ProvidersManagementSection({
  query,
}: {
  query?: ProviderListQuery;
}) {
  const session = await requireSession();
  const role = await getOrganizationRole(
    session.user.id,
    await resolveActiveOrganizationId(session),
  );
  const providers = await getProviders({
    includeInactive: true,
    ...query,
  });

  return (
    <ProviderManagementClient
      providers={providers}
      query={query ?? {}}
      role={role}
    />
  );
}
