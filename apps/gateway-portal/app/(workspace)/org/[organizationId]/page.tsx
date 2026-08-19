import type { Metadata } from "next";
import { Suspense } from "react";

import { WorkspaceOverviewSection } from "@/components/workspace/workspace-overview-section";
import { WorkspaceOverviewSkeleton } from "@/components/workspace/workspace-overview-skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { privatePageMetadata } from "@/lib/site";

export const metadata: Metadata = privatePageMetadata(
  "Overview",
  "Monitor usage, manage providers, and govern access from a single control plane.",
);

export default function WorkspacePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace"
        title="Overview"
        description="Monitor usage, manage providers, and govern access from a single control plane."
      />

      <Suspense fallback={<WorkspaceOverviewSkeleton />}>
        <WorkspaceOverviewSection />
      </Suspense>
    </div>
  );
}
