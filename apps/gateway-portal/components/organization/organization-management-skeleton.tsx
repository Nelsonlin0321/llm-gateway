import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function OrganizationManagementSkeleton() {
  return (
    <div className="space-y-6">
      <section className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Card key={index} className="bg-surface-1 shadow-none">
            <CardHeader className="gap-1 pb-2">
              <Skeleton className="h-3 w-20" />
              <CardTitle>
                <Skeleton className="h-8 w-10" />
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>
      {Array.from({ length: 3 }, (_, index) => (
        <Card key={index}>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
