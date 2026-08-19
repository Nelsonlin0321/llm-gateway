import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";

import { AnalyticsSection } from "@/components/analytics/analytics-section";
import { AnalyticsSkeleton } from "@/components/analytics/analytics-skeleton";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { privatePageMetadata } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = privatePageMetadata(
  "Analytics",
  "Explore requests, tokens, and cost as stacked series by day. Choose a metric, stack by dimension, and filter on metadata attributes.",
);

export default function AnalyticsPage() {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Insights"
        title="Analytics"
        description="Explore requests, tokens, and cost as stacked series by day. Choose a metric, stack by dimension, and filter on metadata attributes."
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

      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsSection />
      </Suspense>
    </section>
  );
}
