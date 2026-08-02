import { AnalyticsSkeleton } from "@/components/analytics/analytics-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <section className="flex flex-col gap-6">
      <div className="space-y-2 border-b border-border pb-6">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <AnalyticsSkeleton />
    </section>
  );
}
