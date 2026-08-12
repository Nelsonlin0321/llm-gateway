import { Suspense } from "react";

import { SignUpForm } from "@/components/auth/sign-up-form";

function SignUpFallback() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-6xl items-center justify-center px-5 py-8 sm:px-6">
      <div
        className="h-80 w-full max-w-md animate-pulse rounded-xl border border-border bg-card"
        aria-hidden
      />
    </main>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<SignUpFallback />}>
      <SignUpForm />
    </Suspense>
  );
}
