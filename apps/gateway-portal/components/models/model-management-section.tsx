import { notFound } from "next/navigation";

import { getModelsForProvider } from "@/app/server-actions/model/get-models";
import { ModelManagementClient } from "@/components/models/model-management-client";

type ModelManagementSectionProps = {
  providerId: string;
};

export async function ModelManagementSection({
  providerId,
}: ModelManagementSectionProps) {
  const result = await getModelsForProvider({ providerId });

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
    <ModelManagementClient provider={result.provider} models={result.models} />
  );
}
