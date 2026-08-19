import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth-server";
import {
  ensureDefaultOrganizationForUser,
  selectWorkspaceOrganizationId,
} from "@/lib/organization/service";
import { privatePageMetadata } from "@/lib/site";

export const metadata: Metadata = privatePageMetadata(
  "Workspace",
  "Open your organization console to manage providers, models, keys, and analytics.",
);

export default async function WorkspaceIndexPage() {
  const session = await requireSession("/workspace");
  const organizations = await ensureDefaultOrganizationForUser(session.user);
  const organizationId = selectWorkspaceOrganizationId(
    organizations,
    session.session.activeOrganizationId,
  );

  if (!organizationId) {
    redirect("/organization");
  }

  redirect(`/org/${organizationId}`);
}
