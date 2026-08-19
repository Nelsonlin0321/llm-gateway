import type { Metadata } from "next";
import { cache } from "react";

import { AcceptInvitationClient } from "@/components/organization/accept-invitation-client";
import { getInvitationPreview } from "@/lib/organization/service";
import { noIndexRobots } from "@/lib/site";

const loadInvitationPreview = cache(getInvitationPreview);

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}): Promise<Metadata> {
  const { id } = await searchParams;
  const invitationId = id?.trim() ?? "";
  const preview = invitationId
    ? await loadInvitationPreview(invitationId)
    : null;

  return {
    title: preview
      ? `Join ${preview.organizationName}`
      : "Invitation",
    description: preview
      ? `Accept your invitation to join ${preview.organizationName} on Gateway.`
      : "This organization invitation is missing or is no longer valid.",
    robots: noIndexRobots,
  };
}

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const invitationId = id?.trim() ?? "";
  const preview = invitationId
    ? await loadInvitationPreview(invitationId)
    : null;

  return (
    <AcceptInvitationClient invitationId={invitationId} preview={preview} />
  );
}
