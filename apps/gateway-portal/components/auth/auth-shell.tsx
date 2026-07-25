import Link from "next/link";
import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AuthShellProps = {
  title: string;
  description: string;
  footerLabel: string;
  footerHref: string;
  footerLinkText: string;
  children: ReactNode;
};

export function AuthShell({
  title,
  description,
  footerLabel,
  footerHref,
  footerLinkText,
  children,
}: AuthShellProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-12">
      <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,480px)] lg:items-center">
        <section className="space-y-6">
          <div className="inline-flex rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium tracking-[0.12em] text-text-secondary uppercase backdrop-blur-sm">
            Gateway Portal
          </div>
          <div className="space-y-4">
            <h1 className="max-w-2xl [font-family:var(--font-display)] text-4xl leading-tight font-semibold tracking-[-0.03em] text-foreground sm:text-5xl">
              Manage gateway access, spend, and policies from one place.
            </h1>
            <p className="max-w-xl text-base leading-7 text-text-secondary sm:text-lg">
              Configure provider credentials, issue child API keys, and track
              usage across teams, users, and projects.
            </p>
          </div>
        </section>

        <Card className="border-border/80 bg-background/90 backdrop-blur-sm">
          <CardHeader className="space-y-3">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {children}
            <p className="text-sm text-text-secondary">
              {footerLabel}{" "}
              <Link
                href={footerHref}
                className="font-medium text-accent transition-colors hover:text-accent/80"
              >
                {footerLinkText}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
