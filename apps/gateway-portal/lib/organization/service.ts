import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { invitation, member, organization } from "@/lib/db/schema";
import {
  defaultOrganizationName,
  defaultOrganizationSlug,
} from "@/lib/organization/slug";
import type { InvitationPreview } from "@/lib/organization/types";

export type OrganizationListItem = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  createdAt: Date;
  role: string;
};

export async function listOrganizationsForUser(
  userId: string,
): Promise<OrganizationListItem[]> {
  return db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo,
      createdAt: organization.createdAt,
      role: member.role,
    })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(eq(member.userId, userId));
}

export async function getOrganizationMembership(
  userId: string,
  organizationId: string,
) {
  const [row] = await db
    .select({
      id: member.id,
      role: member.role,
      organizationId: member.organizationId,
    })
    .from(member)
    .where(
      and(eq(member.userId, userId), eq(member.organizationId, organizationId)),
    )
    .limit(1);

  return row ?? null;
}

export async function resolveActiveOrganizationId(session: {
  user: { id: string };
  session: { activeOrganizationId?: string | null };
}) {
  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) {
    return null;
  }

  const membership = await getOrganizationMembership(
    session.user.id,
    organizationId,
  );
  return membership ? organizationId : null;
}

export function selectWorkspaceOrganizationId(
  organizations: OrganizationListItem[],
  activeOrganizationId?: string | null,
): string | null {
  if (
    activeOrganizationId &&
    organizations.some((org) => org.id === activeOrganizationId)
  ) {
    return activeOrganizationId;
  }

  return organizations[0]?.id ?? null;
}

export async function createDefaultOrganizationForUser(user: {
  id: string;
  name: string;
  email: string;
}) {
  const existing = await listOrganizationsForUser(user.id);
  if (existing.length > 0) {
    return existing[0]!;
  }

  return auth.api.createOrganization({
    body: {
      name: defaultOrganizationName(user),
      slug: defaultOrganizationSlug(user),
      userId: user.id,
      metadata: { isDefault: true },
      keepCurrentActiveOrganization: true,
    },
  });
}

export async function ensureDefaultOrganizationForUser(user: {
  id: string;
  name: string;
  email: string;
}): Promise<OrganizationListItem[]> {
  const existing = await listOrganizationsForUser(user.id);
  if (existing.length > 0) {
    return existing;
  }

  await createDefaultOrganizationForUser(user);
  return listOrganizationsForUser(user.id);
}

export async function getInvitationPreview(
  invitationId: string,
): Promise<InvitationPreview | null> {
  const [row] = await db
    .select({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      organizationName: organization.name,
    })
    .from(invitation)
    .innerJoin(organization, eq(invitation.organizationId, organization.id))
    .where(and(eq(invitation.id, invitationId)))
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    ...row,
    expiresAt: row.expiresAt.toISOString(),
  };
}
