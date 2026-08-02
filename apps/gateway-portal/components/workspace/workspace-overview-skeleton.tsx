import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function WorkspaceOverviewSkeleton() {
  return (
    <div className="space-y-8">
      <section className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card px-4 py-4 shadow-card"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-16" />
            <Skeleton className="mt-2 h-3 w-36" />
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="grid gap-3 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-border bg-card shadow-card">
              <CardHeader className="gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-24" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-24 w-full rounded-md" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-border bg-card shadow-card">
              <CardHeader className="gap-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="size-8 rounded-md" />
                  <Skeleton className="h-5 w-14 rounded-sm" />
                </div>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
