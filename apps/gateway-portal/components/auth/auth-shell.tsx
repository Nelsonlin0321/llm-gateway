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
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-md flex-col justify-center px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 transition-opacity hover:opacity-90"
        >
          <span className="flex size-8 items-center justify-center rounded-md bg-accent text-[11px] font-bold tracking-tight text-accent-foreground">
            GW
          </span>
          <span className="font-heading text-sm font-semibold tracking-[-0.02em] text-text-primary">
            Gateway
          </span>
        </Link>
        <p className="mt-3 text-[13px] text-text-secondary">
          Enterprise LLM control plane
        </p>
      </div>

      <Card className="border-border bg-card shadow-card">
        <CardHeader className="space-y-1.5 border-b border-border pb-4">
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription className="text-[13px] leading-5">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          {children}
          <p className="text-center text-[13px] text-text-secondary">
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
    </main>
  );
}
