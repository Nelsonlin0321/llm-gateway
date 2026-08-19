import { WorkspaceOverviewSkeleton } from "@/components/workspace/workspace-overview-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function WorkspaceLoading() {
  return (
    <div className="mx-auto w-full max-w-350 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="space-y-8">
        <div className="space-y-2 border-b border-border pb-6">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <WorkspaceOverviewSkeleton />
      </div>
    </div>
  );
}
