"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { oauthErrorMessage } from "@/components/auth/oauth-error";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";
import { safeReturnPath } from "@/lib/auth-redirect";

const inputClassName =
  "h-10 w-full rounded-md border border-border-visible bg-transparent px-3 text-sm text-foreground transition-[border-color,box-shadow] placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-3 focus:ring-ring/40";

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<"form">["onSubmit"]>
>[0];

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextPath = safeReturnPath(searchParams.get("next"));

  // Surface OAuth callback failures (e.g. account_not_linked) returned as ?error=
  useEffect(() => {
    const message = oauthErrorMessage(searchParams.get("error"));
    if (!message) return;

    setError(message);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("error");
    params.delete("error_description");
    const query = params.toString();
    router.replace(query ? `/sign-in?${query}` : "/sign-in", { scroll: false });
  }, [searchParams, router]);

  const handleSubmit = async (e: FormSubmitEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    const res = await signIn.email({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });

    if (res.error) {
      setError(res.error.message || "Something went wrong.");
      setIsSubmitting(false);
      return;
    }

    router.push(nextPath);
  };

  return (
    <AuthShell
      title="Sign in"
      heading="Sign in to llm-gateway.io"
      subheading="Access providers, child API keys, policies, and usage analytics for your organization."
      description="Sign in to manage providers, child keys, and workspace settings."
      footerLabel="Need an account?"
      footerHref={
        nextPath === "/workspace"
          ? "/sign-up"
          : `/sign-up?next=${encodeURIComponent(nextPath)}`
      }
      footerLinkText="Create one"
    >
      <div className="space-y-4">
        <GoogleSignInButton
          callbackURL={nextPath}
          errorCallbackURL="/sign-in"
          label="Continue with Google"
        />

        <AuthDivider />

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-text-primary"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              required
              className={inputClassName}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-text-primary"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              required
              className={inputClassName}
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-md border border-error/20 bg-error-bg px-3 py-2.5 text-sm text-error"
            >
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            size="default"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
