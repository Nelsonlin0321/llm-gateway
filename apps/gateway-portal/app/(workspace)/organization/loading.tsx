import { OrganizationManagementSkeleton } from "@/components/organization/organization-management-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrganizationLoading() {
  return (
    <section className="flex flex-col gap-6">
      <div className="space-y-2 border-b border-border pb-6">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <OrganizationManagementSkeleton />
    </section>
  );
}
