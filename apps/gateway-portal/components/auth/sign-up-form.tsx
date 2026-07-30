"use client";

import { useState, type ComponentProps } from "react";
import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { signUp } from "@/lib/auth-client";

const inputClassName =
  "h-10 w-full rounded-md border border-border-visible bg-transparent px-3 text-sm text-foreground transition-[border-color,box-shadow] placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-3 focus:ring-ring/40";

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<"form">["onSubmit"]>
>[0];

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormSubmitEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    const res = await signUp.email({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });

    if (res.error) {
      setError(res.error.message || "Something went wrong.");
      setIsSubmitting(false);
      return;
    }

    router.push("/workspace/overview");
  };

  return (
    <AuthShell
      title="Create account"
      description="Start managing gateway credentials, pricing, and usage in your own workspace."
      footerLabel="Already have an account?"
      footerHref="/sign-in"
      footerLinkText="Sign in"
    >
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

        {error ? (
          <p className="rounded-xl border border-(--error)/20 bg-error-bg px-4 py-3 text-sm text-error">
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
    </AuthShell>
  );
}
