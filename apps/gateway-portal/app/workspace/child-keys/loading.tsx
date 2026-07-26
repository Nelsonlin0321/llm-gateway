import { ChildKeyManagementSkeleton } from "@/components/child-keys/child-key-management-skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChildKeysLoading() {
  return (
    <section className="flex flex-col gap-5">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
        <Card className="bg-surface-1">
          <CardHeader className="gap-4">
            <Skeleton className="h-5 w-28 rounded-sm" />
            <Skeleton className="h-12 w-full max-w-xl" />
            <Skeleton className="h-4 w-full max-w-lg" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-40 rounded-md" />
          </CardContent>
        </Card>
        <Card className="bg-surface-1">
          <CardHeader className="gap-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </CardContent>
        </Card>
      </section>
      <ChildKeyManagementSkeleton />
    </section>
  );
}
