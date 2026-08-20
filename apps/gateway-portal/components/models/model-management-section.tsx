import { notFound } from "next/navigation";

import { getModelsForOrganization } from "@/app/server-actions/model/get-models";
import { ModelManagementClient } from "@/components/models/model-management-client";
import { requireSession } from "@/lib/auth-server";
import type { ModelListQuery } from "@/lib/model/schema";
import { getOrganizationRole } from "@/lib/organization/access";

type ModelManagementSectionProps = {
  organizationId: string;
  query?: ModelListQuery;
};

export async function ModelManagementSection({
  organizationId,
  query = {},
}: ModelManagementSectionProps) {
  const session = await requireSession();
  const role = await getOrganizationRole(session.user.id, organizationId);
  const result = await getModelsForOrganization({
    organizationId,
    ...query,
  });

  if (!result.ok) {
    if (result.code === "not_found" || result.code === "forbidden") {
      notFound();
    }

    return (
      <div className="rounded-lg border border-error/30 bg-error-bg px-4 py-3 text-sm text-error">
        {result.error}
      </div>
    );
  }

  return (
    <ModelManagementClient
      organizationId={organizationId}
      providers={result.providers}
      models={result.models}
      query={query}
      role={role}
    />
  );
}
