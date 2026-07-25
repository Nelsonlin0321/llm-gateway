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
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metricSkeletons.map((index) => (
          <Card
            key={index}
            className="bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-1)_96%,transparent),color-mix(in_srgb,var(--surface-1)_80%,transparent))]"
          >
            <CardHeader className="pb-3">
              <CardDescription as="div">
                <Skeleton className="h-4 w-20" />
              </CardDescription>
              <CardTitle>
                <Skeleton className="h-10 w-14" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-[1.8rem]">
              <Skeleton className="h-8 w-56" />
            </CardTitle>
            <CardDescription as="div" className="space-y-2">
              <Skeleton className="h-4 w-full max-w-2xl" />
              <Skeleton className="h-4 w-full max-w-xl" />
            </CardDescription>
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-2">
            {providerCardSkeletons.map((index) => (
              <Card
                key={index}
                className="border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-background"
              >
                <CardHeader className="gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Skeleton className="h-7 w-28" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-72 max-w-full" />
                    </div>

                    <div className="flex items-center gap-2">
                      <Skeleton className="h-9 w-20 rounded-lg" />
                      <Skeleton className="h-9 w-24 rounded-lg" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {Array.from({ length: 4 }, (_, chipIndex) => (
                      <div
                        key={chipIndex}
                        className="rounded-2xl border border-border bg-surface-1 px-4 py-3"
                      >
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="mt-2 h-4 w-20" />
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-border bg-surface-1 px-4 py-3">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="mt-2 h-4 w-24" />
                  </div>

                  <Skeleton className="h-3 w-36" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
