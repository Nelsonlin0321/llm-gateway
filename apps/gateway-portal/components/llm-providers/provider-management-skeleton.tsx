import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const metricSkeletons = Array.from({ length: 5 }, (_, index) => index);
const providerCardSkeletons = Array.from({ length: 4 }, (_, index) => index);

export function ProviderManagementSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-32 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {metricSkeletons.map((index) => (
          <Card
            key={index}
            className="bg-surface-1 shadow-none"
          >
            <CardHeader className="gap-1 pb-2">
              <CardDescription>
                <Skeleton className="h-3 w-20" />
              </CardDescription>
              <CardTitle>
                <Skeleton className="h-8 w-14" />
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
            <CardTitle className="text-[1.8rem]">
              <Skeleton className="h-7 w-48" />
            </CardTitle>
            <CardDescription className="space-y-2">
              <Skeleton className="h-4 w-full max-w-2xl" />
              <Skeleton className="h-4 w-full max-w-xl" />
            </CardDescription>
          </div>
          <Skeleton className="h-9 w-32 rounded-md" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-2">
            {providerCardSkeletons.map((index) => (
              <Card
                key={index}
                className="border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-background"
              >
                <CardHeader className="gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Skeleton className="size-8 rounded-md" />
                        <Skeleton className="h-6 w-28" />
                        <Skeleton className="h-5 w-14 rounded-sm" />
                        <Skeleton className="h-5 w-18 rounded-sm" />
                      </div>
                      <Skeleton className="h-4 w-72 max-w-full" />
                    </div>

                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-[4.5rem] rounded-md" />
                      <Skeleton className="h-8 w-[5.5rem] rounded-md" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {Array.from({ length: 4 }, (_, chipIndex) => (
                      <div
                        key={chipIndex}
                        className="rounded-lg border border-border bg-surface-1 px-3.5 py-3"
                      >
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="mt-2 h-4 w-20" />
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg border border-border bg-surface-1 px-3.5 py-3">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="mt-2 h-4 w-24" />
                  </div>

                  <Skeleton className="h-3 w-36" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
