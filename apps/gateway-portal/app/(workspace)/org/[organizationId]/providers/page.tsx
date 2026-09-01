import type { Metadata } from "next";
import { Suspense } from "react";

import { ProviderManagementSkeleton } from "@/components/llm-providers/provider-management-skeleton";
import { ProvidersManagementSection } from "@/components/llm-providers/providers-management-section";
import { parseProviderListSearchParams } from "@/lib/llm-provider/schema";
import { privatePageMetadata } from "@/lib/site";

export const metadata: Metadata = privatePageMetadata(
  "Providers",
  "Connect upstream LLM endpoints, store encrypted credentials, and manage routing metadata.",
);

type OrganizationProvidersPageProps = {
  params: Promise<{
    organizationId: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ProvidersPage({
  params,
  searchParams,
}: OrganizationProvidersPageProps) {
  const { organizationId } = await params;
  const query = parseProviderListSearchParams(await searchParams);

  return (
    <section className="flex flex-col gap-6">
      <Suspense fallback={<ProviderManagementSkeleton />}>
        <ProvidersManagementSection
          organizationId={organizationId}
          query={query}
        />
      </Suspense>
    </section>
  );
}
