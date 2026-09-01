import type { Metadata } from "next";
import { Suspense } from "react";

import { ChildKeyManagementSection } from "@/components/child-keys/child-key-management-section";
import { ChildKeyManagementSkeleton } from "@/components/child-keys/child-key-management-skeleton";
import { privatePageMetadata } from "@/lib/site";

export const metadata: Metadata = privatePageMetadata(
  "Child API keys",
  "Issue scoped keys for teams, projects, and applications without exposing master provider credentials.",
);

type OrganizationChildKeysPageProps = {
  params: Promise<{
    organizationId: string;
  }>;
};

export default async function ChildKeysPage({
  params,
}: OrganizationChildKeysPageProps) {
  const { organizationId } = await params;

  return (
    <section className="flex flex-col gap-6">
      <Suspense fallback={<ChildKeyManagementSkeleton />}>
        <ChildKeyManagementSection organizationId={organizationId} />
      </Suspense>
    </section>
  );
}
