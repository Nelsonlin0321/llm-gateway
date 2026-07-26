import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  KeyRound,
  LayoutDashboard,
  Server,
} from "lucide-react";

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

const destinations = [
  {
    href: "/",
    label: "Home",
    detail: "Portal overview and product entry points",
    icon: LayoutDashboard,
  },
  {
    href: "/workspace/providers",
    label: "Providers",
    detail: "Connect upstream APIs and master credentials",
    icon: Server,
  },
  {
    href: "/sign-in",
    label: "Sign in",
    detail: "Access the control plane with your account",
    icon: KeyRound,
  },
] as const;

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid w-full gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <Card className="overflow-hidden border-border bg-surface-1">
          <CardHeader className="gap-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="error" className="gap-1.5 font-mono">
                HTTP 404
              </Badge>
              <Badge
                variant="neutral"
                className="font-mono text-[11px] uppercase tracking-[0.08em]"
              >
                /not-found
              </Badge>
            </div>

            <div className="space-y-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
                Route missing
              </p>
              <h1 className="max-w-2xl font-heading text-[2.35rem] leading-[1.05] font-bold tracking-[-0.03em] text-foreground sm:text-[3rem]">
                This path is not on the gateway map.
              </h1>
              <CardDescription className="max-w-xl text-base leading-7 text-text-secondary">
                The page you requested does not exist, was moved, or is outside
                the current portal surface. Head back home or jump into a known
                control-plane route.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <Link
                href="/"
                className={cn(
                  buttonVariants({ variant: "default", size: "default" }),
                  "px-4",
                )}
              >
                <ArrowLeft className="size-4" />
                Back to home
              </Link>
              <Link
                href="/workspace/overview"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "default" }),
                  "px-4",
                )}
              >
                Launch portal
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="rounded-lg border border-border bg-surface-2 p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface-1 text-accent">
                  <Compass className="size-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold tracking-[-0.02em] text-foreground">
                    Operator tip
                  </p>
                  <p className="text-sm leading-6 text-text-secondary">
                    Bookmark workspace routes after sign-in. Provider setup,
                    child keys, policies, and analytics live under authenticated
                    workspace paths—not deep marketing URLs.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-surface-1">
          <CardHeader className="gap-2">
            <Badge
              variant="neutral"
              className="w-fit font-mono text-[11px] uppercase tracking-[0.08em]"
            >
              Known routes
            </Badge>
            <CardTitle className="text-[1.2rem]">
              Continue from a valid entry point
            </CardTitle>
            <CardDescription>
              These paths are active in the portal today.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2.5">
            {destinations.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-start gap-3 rounded-lg border border-border bg-surface-2 px-3.5 py-3 transition-colors hover:border-border-visible hover:bg-surface-1"
                >
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface-1 text-text-secondary transition-colors group-hover:text-accent">
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold tracking-[-0.02em] text-foreground">
                        {item.label}
                      </p>
                      <ArrowRight className="size-3.5 shrink-0 text-text-tertiary transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                    </div>
                    <p className="text-sm leading-5 text-text-secondary">
                      {item.detail}
                    </p>
                    <p className="font-mono text-[11px] text-text-tertiary">
                      {item.href}
                    </p>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
