import { ModelManagementSkeleton } from "@/components/models/model-management-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrganizationModelsLoading() {
  return (
    <section className="flex flex-col gap-6">
      <div className="space-y-2 border-b border-border pb-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <ModelManagementSkeleton />
    </section>
  );
}
