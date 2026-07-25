import Link from "next/link";
import { ArrowLeft, LockKeyhole, Server, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireSession } from "@/lib/auth-server";
import { cn } from "@/lib/utils";
import { Suspense } from "react";
import { ProviderManagementSkeleton } from "@/components/providers/provider-management-skeleton";
import { ProvidersManagementSection } from "@/components/providers/providers-management-section";

export default async function ProvidersPage() {
  const session = await requireSession();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <Card className="overflow-hidden border-[color-mix(in_srgb,var(--accent)_14%,var(--border))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-1)_96%,transparent),color-mix(in_srgb,var(--surface-1)_84%,transparent))]">
          <CardHeader className="gap-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="info" className="gap-1.5">
                <LockKeyhole className="size-3.5" />
                Encrypted provider vault
              </Badge>
              <Badge variant="neutral">/providers</Badge>
            </div>
            <div className="space-y-4">
              <h1 className="[font-family:var(--font-display)] text-[2.8rem] leading-[0.98] font-semibold tracking-[-0.04em] text-foreground sm:text-[3.8rem]">
                Manage upstream LLM providers without exposing master
                credentials.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-text-secondary sm:text-lg">
                Store provider API URLs, encrypt API keys before they hit the
                database, and keep pricing metadata close to the routing prefix
                that your gateway uses.
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "h-10 rounded-lg px-4 text-sm",
              )}
            >
              <ArrowLeft className="size-4" />
              Back to dashboard
            </Link>
            <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-text-secondary">
              Signed in as{" "}
              <span className="font-medium text-text-primary">
                {session.user.name || session.user.email}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface-1">
          <CardHeader>
            <CardTitle className="text-[1.65rem]">
              What this page controls
            </CardTitle>
            <CardDescription>
              Provider names become the routing prefix of the model name, so
              validation and duplicate protection stay strict on purpose.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <FeatureRow
              icon={Server}
              title="Routing metadata"
              description="Pair a provider prefix with a master API URL and compatibility type."
            />
            <FeatureRow
              icon={LockKeyhole}
              title="Encrypted secrets"
              description="API keys are AES-256-GCM encrypted before storage and never echoed back to the browser."
            />
            <FeatureRow
              icon={Wallet}
              title="Pricing data"
              description="Keep input, cached-input, and output pricing next to the provider for later cost controls."
            />
          </CardContent>
        </Card>
      </section>

      <Suspense fallback={<ProviderManagementSkeleton />}>
        <ProvidersManagementSection />
      </Suspense>
    </main>
  );
}

function FeatureRow({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Server;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-4">
      <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
        <Icon className="size-4 text-accent" />
        {title}
      </div>
      <p className="mt-2 text-sm leading-6 text-text-secondary">
        {description}
      </p>
    </div>
  );
}
