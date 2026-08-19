import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";

import { ProviderManagementSkeleton } from "@/components/llm-providers/provider-management-skeleton";
import { ProvidersManagementSection } from "@/components/llm-providers/providers-management-section";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { parseProviderListSearchParams } from "@/lib/llm-provider/schema";
import { privatePageMetadata } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = privatePageMetadata(
  "Providers",
  "Connect upstream LLM endpoints, store encrypted credentials, and manage routing metadata.",
);

export default async function ProvidersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = parseProviderListSearchParams(await searchParams);

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Infrastructure"
        title="Providers"
        description="Connect upstream LLM endpoints, store encrypted credentials, and manage routing metadata."
        actions={
          <Link
            href="/workspace"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <ArrowLeft className="size-3.5" />
            Overview
          </Link>
        }
      />

      <Suspense fallback={<ProviderManagementSkeleton />}>
        <ProvidersManagementSection query={query} />
      </Suspense>
    </section>
  );
}
