import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, KeyRound, ShieldCheck, Tags } from "lucide-react";

import { ChildKeyManagementSection } from "@/components/child-keys/child-key-management-section";
import { ChildKeyManagementSkeleton } from "@/components/child-keys/child-key-management-skeleton";
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

export default function ChildKeysPage() {
  return (
    <section className="flex flex-col gap-5">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
        <Card className="overflow-hidden border-border bg-surface-1">
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="info" className="gap-1.5">
                <KeyRound className="size-3.5" />
                Child API keys
              </Badge>
              <Badge variant="neutral" className="font-mono">
                /workspace/child-keys
              </Badge>
            </div>
            <div className="space-y-3">
              <h1 className="font-heading text-[2.1rem] leading-[0.98] font-semibold tracking-[-0.04em] text-foreground sm:text-[2.6rem]">
                Issue scoped child keys for teams, projects, and apps.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
                Create signed <span className="font-mono">sk_</span> JWTs
                with optional tags, then activate or deactivate them without
                exposing master provider credentials.
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5 sm:flex-row">
            <Link
              href="/workspace"
              className={cn(
                buttonVariants({ variant: "secondary", size: "default" }),
                "px-4",
              )}
            >
              <ArrowLeft className="size-4" />
              Back to workspace
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-surface-1">
          <CardHeader className="gap-2">
            <CardTitle className="text-[1.35rem]">
              What this page controls
            </CardTitle>
            <CardDescription>
              Keys belong to your workspace account. The list shows a masked
              preview; use Reveal key to view the full secret when needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <FeatureRow
              icon={KeyRound}
              title="Signed JWT secrets"
              description="Tokens start with sk_ and are signed using JWT_SIGNING_SECRET."
            />
            <FeatureRow
              icon={Tags}
              title="Free-form tags"
              description="Any key/value pairs you need — env, project, team, application, owner, or custom labels."
            />
            <FeatureRow
              icon={ShieldCheck}
              title="Active / inactive"
              description="Toggle keys without reissuing secrets when access should pause."
            />
          </CardContent>
        </Card>
      </section>

      <Suspense fallback={<ChildKeyManagementSkeleton />}>
        <ChildKeyManagementSection />
      </Suspense>
    </section>
  );
}

function FeatureRow({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof KeyRound;
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
