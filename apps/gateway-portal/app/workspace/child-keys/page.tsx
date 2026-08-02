import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";

import { ChildKeyManagementSection } from "@/components/child-keys/child-key-management-section";
import { ChildKeyManagementSkeleton } from "@/components/child-keys/child-key-management-skeleton";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

export default function ChildKeysPage() {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Access"
        title="Child API keys"
        description="Issue scoped keys for teams, projects, and applications without exposing master provider credentials."
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

      <Suspense fallback={<ChildKeyManagementSkeleton />}>
        <ChildKeyManagementSection />
      </Suspense>
    </section>
  );
}
