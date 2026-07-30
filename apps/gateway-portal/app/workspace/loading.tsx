import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Card className="border-border bg-surface-1">
        <CardHeader className="gap-4 border-b border-border">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-36 rounded-sm" />
            <Skeleton className="h-6 w-24 rounded-sm" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-11 w-full max-w-md" />
            <Skeleton className="h-4 w-full max-w-3xl" />
            <Skeleton className="h-4 w-4/5 max-w-2xl" />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pt-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="rounded-lg border border-border bg-background px-4 py-4"
            >
              <Skeleton className="h-3 w-28" />
              <Skeleton className="mt-3 h-8 w-16" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-4/5" />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Card key={index} className="border-border bg-surface-1">
            <CardHeader className="gap-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Card key={index} className="border-border bg-surface-1">
            <CardHeader className="gap-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-6 w-20 rounded-sm" />
              </div>
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
