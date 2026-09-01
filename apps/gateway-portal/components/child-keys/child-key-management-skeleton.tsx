import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ChildKeyManagementSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Card key={index} className="bg-surface-1 shadow-none">
            <CardHeader className="gap-1 pb-2">
              <CardDescription>
                <Skeleton className="h-3 w-20" />
              </CardDescription>
              <CardTitle>
                <Skeleton className="h-8 w-12" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-28" />
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
          <Skeleton className="h-9 w-36 rounded-md" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
