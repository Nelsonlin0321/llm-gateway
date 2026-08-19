import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";

import { ModelManagementSection } from "@/components/models/model-management-section";
import { ModelManagementSkeleton } from "@/components/models/model-management-skeleton";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { parseModelListSearchParams } from "@/lib/model/schema";
import { privatePageMetadata } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = privatePageMetadata(
  "Models",
  "Register upstream model IDs, downstream aliases, and token prices for every provider in this organization.",
);

type OrganizationModelsPageProps = {
  params: Promise<{
    organizationId: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function OrganizationModelsPage({
  params,
  searchParams,
}: OrganizationModelsPageProps) {
  const { organizationId } = await params;
  const query = parseModelListSearchParams(await searchParams);

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Pricing & routing"
        title="Models"
        description="Register upstream model IDs, downstream aliases, and token prices for every provider in this organization."
        actions={
          <Link
            href={`/org/${organizationId}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <ArrowLeft className="size-3.5" />
            Overview
          </Link>
        }
      />

      <Suspense fallback={<ModelManagementSkeleton />}>
        <ModelManagementSection
          organizationId={organizationId}
          query={query}
        />
      </Suspense>
    </section>
  );
}
