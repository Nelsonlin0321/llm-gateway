"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { organization, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  normalizeOrganizationRole,
  ORGANIZATION_ROLE_LABELS,
} from "@/lib/organization/permissions";
import type { InvitationPreview } from "@/lib/organization/types";

type AcceptInvitationClientProps = {
  invitationId: string;
  preview: InvitationPreview | null;
};

export function AcceptInvitationClient({
  invitationId,
  preview,
}: AcceptInvitationClientProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isWorking, setIsWorking] = useState(false);

  const expired =
    preview !== null &&
    (preview.status !== "pending" || new Date(preview.expiresAt) < new Date());
  const nextPath = `/accept-invitation?id=${encodeURIComponent(invitationId)}`;
  const signInHref = `/sign-in?next=${encodeURIComponent(nextPath)}`;
  const signUpHref = `/sign-up?next=${encodeURIComponent(nextPath)}`;

  const handleAction = async (action: "accept" | "reject") => {
    setIsWorking(true);
    const result =
      action === "accept"
        ? await organization.acceptInvitation({ invitationId })
        : await organization.rejectInvitation({ invitationId });
    setIsWorking(false);

    if (result.error) {
      toast.error(result.error.message || "Unable to update invitation.");
      return;
    }

    toast.success(
      action === "accept" ? "You joined the organization." : "Invitation declined.",
    );
    router.push("/workspace/organization");
    router.refresh();
  };

  if (!preview) {
    return (
      <AuthShell
        title="Invitation not found"
        heading="This invitation is no longer valid"
        subheading="Ask an organization admin to send a new Gateway invitation."
        description="This invitation is missing or is no longer valid."
        footerLabel="Need an account?"
        footerHref="/sign-up"
        footerLinkText="Create one"
      >
        <p className="text-sm text-text-secondary">
          Ask the organization admin to send a new invitation.
        </p>
      </AuthShell>
    );
  }

  if (expired) {
    return (
      <AuthShell
        title="Invitation expired"
        heading={`Invitation to ${preview.organizationName} expired`}
        subheading="Ask an organization admin to send a new Gateway invitation."
        description={`${preview.organizationName} is no longer accepting this invitation.`}
        footerLabel="Go back to"
        footerHref="/sign-in"
        footerLinkText="sign in"
      >
        <p className="text-sm text-text-secondary">
          Ask a root or admin member to send a new invite to {preview.email}.
        </p>
      </AuthShell>
    );
  }

  const roleLabel =
    ORGANIZATION_ROLE_LABELS[normalizeOrganizationRole(preview.role ?? "viewer")];

  if (isPending) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-6xl items-center justify-center px-5 py-8">
        <div
          className="h-80 w-full max-w-md animate-pulse rounded-xl border border-border bg-card"
          aria-hidden
        />
      </main>
    );
  }

  if (!session?.user) {
    return (
      <AuthShell
        title={`Join ${preview.organizationName}`}
        heading={`Join ${preview.organizationName} on Gateway`}
        subheading={`You were invited as ${roleLabel}. Sign in with ${preview.email} to accept.`}
        description={`You were invited as ${roleLabel}. Sign in with ${preview.email} to accept.`}
        footerLabel="Need an account?"
        footerHref={signUpHref}
        footerLinkText="Create one"
      >
        <div className="space-y-4">
          <p className="rounded-md border border-border bg-surface-2 px-3.5 py-3 text-sm text-text-secondary">
            This invitation was sent to{" "}
            <span className="font-medium text-text-primary">{preview.email}</span>.
          </p>
          <Link
            href={signInHref}
            className={cn(buttonVariants({ variant: "default" }), "w-full")}
          >
            Sign in to continue
          </Link>
        </div>
      </AuthShell>
    );
  }

  const emailMismatch =
    session.user.email.toLowerCase() !== preview.email.toLowerCase();

  return (
    <AuthShell
      title={`Join ${preview.organizationName}`}
      heading={`Join ${preview.organizationName} on Gateway`}
      subheading={`You were invited as ${roleLabel}. Accept to start managing providers and keys with this organization.`}
      description={`Invited as ${roleLabel}.`}
      footerLabel="Not now?"
      footerHref="/workspace"
      footerLinkText="Go to workspace"
    >
      <div className="space-y-4">
        <p className="rounded-md border border-border bg-surface-2 px-3.5 py-3 text-sm text-text-secondary">
          Invitation for{" "}
          <span className="font-medium text-text-primary">{preview.email}</span>.
        </p>

        {emailMismatch ? (
          <p
            role="alert"
            className="rounded-md border border-error/20 bg-error-bg px-3 py-2.5 text-sm text-error"
          >
            You are signed in as {session.user.email}. Sign in with{" "}
            {preview.email} to accept this invitation.
          </p>
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={isWorking}
              onClick={() => void handleAction("reject")}
            >
              Decline
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={isWorking}
              onClick={() => void handleAction("accept")}
            >
              {isWorking ? "Working..." : "Accept invitation"}
            </Button>
          </div>
        )}
      </div>
    </AuthShell>
  );
}
