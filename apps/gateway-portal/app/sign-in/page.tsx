import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { SignInForm } from "@/components/auth/sign-in-form";
import { safeReturnPath } from "@/lib/auth-redirect";
import { getSessionOrNull } from "@/lib/auth-server";
import { noIndexRobots } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to llm-gateway.io to manage LLM providers, child API keys, and usage analytics.",
  robots: noIndexRobots,
};

function SignInFallback() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-6xl items-center justify-center px-5 py-8 sm:px-6">
      <div
        className="h-80 w-full max-w-md animate-pulse rounded-xl border border-border bg-card"
        aria-hidden
      />
    </main>
  );
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSessionOrNull();
  if (session) {
    const { next } = await searchParams;
    redirect(safeReturnPath(next, "/workspace"));
  }

  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInForm />
    </Suspense>
  );
}
