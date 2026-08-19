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
  heading?: string;
  subheading?: string;
  footerLabel: string;
  footerHref: string;
  footerLinkText: string;
  children: ReactNode;
};

export function AuthShell({
  title,
  description,
  heading = "Manage gateway access, spend, and policies from one place.",
  subheading = "Configure provider credentials, issue child API keys, and track usage across teams, users, and projects.",
  footerLabel,
  footerHref,
  footerLinkText,
  children,
}: AuthShellProps) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-6xl items-center px-5 py-8 sm:px-6">
      <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,420px)] lg:items-center">
        <section className="space-y-5">
          <div className="inline-flex rounded-sm border border-border bg-surface-1 px-2.5 py-1 text-[11px] font-medium tracking-[0.08em] text-text-secondary uppercase">
            Gateway Portal
          </div>
          <div className="space-y-3">
            <h1 className="max-w-2xl font-heading text-[2.25rem] leading-[1.1] font-bold tracking-[-0.02em] text-text-primary sm:text-[2.75rem]">
              {heading}
            </h1>
            <p className="max-w-lg text-sm leading-6 text-text-secondary sm:text-base">
              {subheading}
            </p>
          </div>
        </section>

        <Card className="border-border bg-card shadow-card">
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {children}
            <p className="text-sm text-text-secondary">
              {footerLabel}{" "}
              <Link
                href={footerHref}
                className="font-medium text-accent transition-colors hover:opacity-90"
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
