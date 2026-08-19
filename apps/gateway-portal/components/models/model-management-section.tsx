import { notFound } from "next/navigation";

import { getModelsForOrganization } from "@/app/server-actions/model/get-models";
import { ModelManagementClient } from "@/components/models/model-management-client";
import type { ModelListQuery } from "@/lib/model/schema";

type ModelManagementSectionProps = {
  organizationId: string;
  query?: ModelListQuery;
};

export async function ModelManagementSection({
  organizationId,
  query = {},
}: ModelManagementSectionProps) {
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
    />
  );
}
