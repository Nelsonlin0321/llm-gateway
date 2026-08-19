import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";

import { OrganizationManagementSection } from "@/components/organization/organization-management-section";
import { OrganizationManagementSkeleton } from "@/components/organization/organization-management-skeleton";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { privatePageMetadata } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = privatePageMetadata(
  "Organization",
  "Create organizations, invite members, and manage root, admin, and viewer roles.",
);

export default function OrganizationPage() {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Access"
        title="Organization"
        description="Create organizations, invite members, and manage root, admin, and viewer roles."
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

      <Suspense fallback={<OrganizationManagementSkeleton />}>
        <OrganizationManagementSection />
      </Suspense>
    </section>
  );
}
