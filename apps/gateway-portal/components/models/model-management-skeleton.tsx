import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ModelManagementSkeleton() {
  return (
    <>
      <section className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Card key={index} className="bg-surface-1 shadow-none">
            <CardHeader className="gap-1 pb-2">
              <CardDescription>
                <Skeleton className="h-3 w-20" />
              </CardDescription>
              <CardTitle>
                <Skeleton className="h-8 w-16" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
          <Skeleton className="h-9 w-28 rounded-md" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    </>
  );
}
