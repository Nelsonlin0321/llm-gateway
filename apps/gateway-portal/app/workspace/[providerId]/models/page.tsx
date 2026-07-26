import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, Boxes, DollarSign, Route } from "lucide-react";

import { ModelManagementSection } from "@/components/models/model-management-section";
import { ModelManagementSkeleton } from "@/components/models/model-management-skeleton";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ProviderModelsPageProps = {
  params: Promise<{
    providerId: string;
  }>;
};

export default async function ProviderModelsPage({
  params,
}: ProviderModelsPageProps) {
  const { providerId } = await params;

  return (
    <section className="flex flex-col gap-5">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
        <Card className="overflow-hidden border-border bg-surface-1">
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="info" className="gap-1.5">
                <Boxes className="size-3.5" />
                Model registry
              </Badge>
              <Badge variant="neutral" className="font-mono">
                /workspace/{providerId}/models
              </Badge>
            </div>
            <div className="space-y-3">
              <h1 className="font-heading text-[2.1rem] leading-[0.98] font-semibold tracking-[-0.04em] text-foreground sm:text-[2.6rem]">
                Register models and pricing for this provider.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
                Define upstream model names, downstream aliases, and token
                prices per 1M tokens so routing and cost reporting stay correct.
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5 sm:flex-row">
            <Link
              href="/workspace/providers"
              className={cn(
                buttonVariants({ variant: "secondary", size: "default" }),
                "px-4",
              )}
            >
              <ArrowLeft className="size-4" />
              Back to providers
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-surface-1">
          <CardHeader className="gap-2">
            <CardTitle className="text-[1.35rem]">
              What this page controls
            </CardTitle>
            <CardDescription>
              Only the provider creator can view and register models. Model
              names may repeat; prices must be positive.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <FeatureRow
              icon={Route}
              title="Name and alias"
              description="Upstream model id plus the downstream alias used for gateway routing."
            />
            <FeatureRow
              icon={DollarSign}
              title="Token pricing"
              description="Input, output, and cached-input prices in USD per 1M tokens."
            />
            <FeatureRow
              icon={Boxes}
              title="Provider scope"
              description="Models always belong to a single LLM provider credential."
            />
          </CardContent>
        </Card>
      </section>

      <Suspense fallback={<ModelManagementSkeleton />}>
        <ModelManagementSection providerId={providerId} />
      </Suspense>
    </section>
  );
}

function FeatureRow({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Boxes;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background px-3.5 py-3.5">
      <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
        <Icon className="size-4 text-accent" />
        {title}
      </div>
      <p className="mt-2 text-sm leading-5 text-text-secondary">{description}</p>
    </div>
  );
}
