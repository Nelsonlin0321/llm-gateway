import { WorkspaceOverviewSkeleton } from "@/components/workspace/workspace-overview-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2 border-b border-border pb-6">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <WorkspaceOverviewSkeleton />
    </div>
  );
}
