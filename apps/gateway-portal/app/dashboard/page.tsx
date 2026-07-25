"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LogOut, ShieldCheck, Wallet, Waypoints } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/sign-in");
    }
  }, [isPending, session, router]);

  if (isPending)
    return <p className="mt-8 text-center text-text-secondary">Loading...</p>;
  if (!session?.user)
    return <p className="mt-8 text-center text-text-secondary">Redirecting...</p>;

  const { user } = session;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <Card className="overflow-hidden border-[color-mix(in_srgb,var(--accent)_14%,var(--border))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-1)_96%,transparent),color-mix(in_srgb,var(--surface-1)_84%,transparent))]">
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info" className="gap-1.5">
                <ShieldCheck className="size-3.5" />
                Authenticated session
              </Badge>
              <Badge variant="neutral" className="font-mono">
                /dashboard
              </Badge>
            </div>
            <div className="space-y-3">
              <h1 className="[font-family:var(--font-display)] text-[2.3rem] leading-[0.98] font-semibold tracking-[-0.04em] text-foreground sm:text-[3rem]">
                Welcome back, {user.name || "there"}.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
                Manage upstream providers, keep encrypted credentials organized,
                and prepare the control plane for keys, policy, and usage
                workflows.
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5 sm:flex-row">
            <Link
              href="/providers"
              className={cn(buttonVariants({ variant: "default", size: "default" }), "px-4")}
            >
              Manage providers
              <ArrowRight className="size-4" />
            </Link>
            <div className="rounded-[16px] border border-border bg-background px-3.5 py-2.5 text-sm text-text-secondary">
              Signed in as{" "}
              <span className="font-medium text-text-primary">{user.email}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface-1">
          <CardHeader className="gap-2">
            <CardTitle className="text-[1.35rem]">What is ready</CardTitle>
            <CardDescription>
              The portal already supports secure provider management and has the
              foundations in place for the next control-plane surfaces.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <DashboardFeature
              icon={Waypoints}
              title="Provider routing"
              description="Store upstream API URLs, compatibility types, and pricing metadata in one place."
            />
            <DashboardFeature
              icon={ShieldCheck}
              title="Encrypted secrets"
              description="Master API keys stay encrypted at rest and never come back through the client."
            />
            <DashboardFeature
              icon={Wallet}
              title="Pricing controls"
              description="Input, cached-input, and output pricing stay attached to each provider for future cost policy work."
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <CompactStat label="User" value={user.name || "Workspace user"} />
        <CompactStat label="Email" value={user.email} mono />
        <CompactStat label="Status" value="Signed in" />
      </section>

      <div className="flex justify-end">
        <Button variant="secondary" onClick={() => signOut()}>
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </main>
  );
}

function DashboardFeature({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[18px] border border-border bg-background px-3.5 py-3.5">
      <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
        <Icon className="size-4 text-accent" />
        {title}
      </div>
      <p className="mt-2 text-sm leading-5 text-text-secondary">{description}</p>
    </div>
  );
}

function CompactStat({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <Card className="bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-1)_96%,transparent),color-mix(in_srgb,var(--surface-1)_82%,transparent))] shadow-none">
      <CardHeader className="gap-1 pb-2">
        <CardDescription className="font-mono text-[11px] uppercase tracking-[0.08em]">
          {label}
        </CardDescription>
        <CardTitle
          className={cn(
            "text-base leading-6",
            mono && "font-mono text-[0.9rem] tracking-[-0.02em]",
          )}
        >
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
