import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";

import { ModelManagementSection } from "@/components/models/model-management-section";
import { ModelManagementSkeleton } from "@/components/models/model-management-skeleton";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

type ProviderModelsPageProps = {
  params: Promise<{
    providerId: string;
  }>;
};

export default async function ProviderModelsPage({
  params,
}: ProviderModelsPageProps) {
  const { providerId } = await params;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Pricing & routing"
        title="Models"
        description="Register upstream model IDs, downstream aliases, and token prices for cost attribution."
        actions={
          <Link
            href="/workspace/providers"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <ArrowLeft className="size-3.5" />
            Providers
          </Link>
        }
      />

      <Suspense fallback={<ModelManagementSkeleton />}>
        <ModelManagementSection providerId={providerId} />
      </Suspense>
    </section>
  );
}
