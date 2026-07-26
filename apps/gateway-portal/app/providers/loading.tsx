import { ProviderManagementSkeleton } from "@/components/llm-providers/provider-management-skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <Card className="overflow-hidden border-border bg-surface-1">
          <CardHeader className="gap-5">
            <div className="flex flex-wrap items-center gap-3">
              <Skeleton className="h-6 w-40 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-12 w-full max-w-3xl" />
              <Skeleton className="h-12 w-11/12 max-w-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full max-w-2xl" />
                <Skeleton className="h-4 w-10/12 max-w-xl" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-10 w-40 rounded-lg" />
            <div className="rounded-lg border border-border bg-background px-4 py-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-2 h-4 w-36" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface-1">
          <CardHeader className="space-y-3">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardHeader>
          <CardContent className="grid gap-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="rounded-lg border border-border bg-background px-4 py-4"
              >
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-3 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-4/5" />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <ProviderManagementSkeleton />
    </main>
  );
}
