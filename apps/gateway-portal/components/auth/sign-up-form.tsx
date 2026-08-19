"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { oauthErrorMessage } from "@/components/auth/oauth-error";
import { Button } from "@/components/ui/button";
import { signUp } from "@/lib/auth-client";
import { safeReturnPath } from "@/lib/auth-redirect";

const inputClassName =
  "h-10 w-full rounded-md border border-border-visible bg-transparent px-3 text-sm text-foreground transition-[border-color,box-shadow] placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-3 focus:ring-ring/40";

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<"form">["onSubmit"]>
>[0];

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const nextPath = safeReturnPath(searchParams.get("next"), "/");

  // Surface OAuth callback failures (e.g. account_not_linked) returned as ?error=
  useEffect(() => {
    const message = oauthErrorMessage(searchParams.get("error"));
    if (!message) return;

    setError(message);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("error");
    params.delete("error_description");
    const query = params.toString();
    router.replace(query ? `/sign-up?${query}` : "/sign-up", { scroll: false });
  }, [searchParams, router]);

  const handleSubmit = async (e: FormSubmitEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsSubmitting(false);
      return;
    }

    const res = await signUp.email({
      name,
      email,
      password,
      // After the user verifies via email link, Better Auth redirects here.
      callbackURL: nextPath,
    });

    if (res.error) {
      setError(res.error.message || "Something went wrong.");
      setIsSubmitting(false);
      return;
    }

    // Account is created but pending email verification (no session yet).
    setPendingEmail(email);
    setIsSubmitting(false);
  };

  if (pendingEmail) {
    return (
      <AuthShell
        title="Check your email"
        heading="Verify your Gateway account"
        subheading="Open the verification link we sent so you can start connecting providers and issuing child keys."
        description="We created your account. Verify your email to finish signing up."
        footerLabel="Already verified?"
        footerHref={
          nextPath === "/"
            ? "/sign-in"
            : `/sign-in?next=${encodeURIComponent(nextPath)}`
        }
        footerLinkText="Sign in"
      >
        <div className="space-y-4">
          <div className="rounded-md border border-border bg-surface-2 px-3.5 py-3 text-sm leading-6 text-text-secondary">
            We sent a verification link to{" "}
            <span className="font-medium text-text-primary">{pendingEmail}</span>
            . Open the link within 15 minutes to activate your account. You will
            be redirected to the home page after verification.
          </div>
          <p className="text-sm text-text-tertiary">
            Did not get the email? Check spam, or try signing in later to
            request a new verification link.
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              setPendingEmail(null);
              setError(null);
            }}
          >
            Use a different email
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create account"
      heading="Create your Gateway account"
      subheading="Connect upstream providers, register model prices, and issue scoped child API keys from one console."
      description="Create a workspace account to configure providers and issue API keys."
      footerLabel="Already have an account?"
      footerHref={
        nextPath === "/"
          ? "/sign-in"
          : `/sign-in?next=${encodeURIComponent(nextPath)}`
      }
      footerLinkText="Sign in"
    >
      <div className="space-y-4">
        <GoogleSignInButton
          callbackURL={nextPath === "/" ? "/workspace" : nextPath}
          errorCallbackURL="/sign-up"
          label="Sign up with Google"
        />

        <AuthDivider />

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-sm font-medium text-text-primary"
            >
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              required
              className={inputClassName}
            />
          </div>

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
              autoComplete="new-password"
              placeholder="Use at least 8 characters"
              required
              minLength={8}
              className={inputClassName}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-text-primary"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              required
              minLength={8}
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
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
