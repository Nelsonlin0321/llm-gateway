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
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-5 py-8 sm:px-6">
      <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,440px)] lg:items-center">
        <section className="space-y-5">
          <div className="inline-flex rounded-full border border-border bg-background/80 px-2.5 py-1 text-[11px] font-medium tracking-[0.12em] text-text-secondary uppercase backdrop-blur-sm">
            Gateway Portal
          </div>
          <div className="space-y-3">
            <h1 className="max-w-2xl [font-family:var(--font-display)] text-[2.6rem] leading-[0.98] font-semibold tracking-[-0.04em] text-foreground sm:text-[3.4rem]">
              Manage gateway access, spend, and policies from one place.
            </h1>
            <p className="max-w-lg text-sm leading-6 text-text-secondary sm:text-base">
              Configure provider credentials, issue child API keys, and track
              usage across teams, users, and projects.
            </p>
          </div>
        </section>

        <Card className="border-border/80 bg-background/92 backdrop-blur-sm">
          <CardHeader className="space-y-2">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
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
