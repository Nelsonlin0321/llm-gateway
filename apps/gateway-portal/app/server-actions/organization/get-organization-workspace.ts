"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { requireSession } from "@/lib/auth-server";
import {
  ensureDefaultOrganizationForUser,
  selectWorkspaceOrganizationId,
} from "@/lib/organization/service";
import type {
  OrganizationDetailView,
  OrganizationInvitationView,
  OrganizationMemberView,
  OrganizationWorkspaceState,
  UserInvitationView,
} from "@/lib/organization/types";

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

export async function getOrganizationWorkspace(): Promise<OrganizationWorkspaceState> {
  const session = await requireSession();
  const organizations = await ensureDefaultOrganizationForUser(session.user);
  const requestHeaders = await headers();

  const activeOrganizationId = selectWorkspaceOrganizationId(
    organizations,
    session.session.activeOrganizationId,
  );

  const fullOrganization = activeOrganizationId
    ? await auth.api.getFullOrganization({
        headers: requestHeaders,
        query: { organizationId: activeOrganizationId },
      })
    : null;

  const incomingInvitations = (await auth.api
    .listUserInvitations({
      headers: requestHeaders,
    })
    .catch(() => [])) as Array<{
    id: string;
    email: string;
    role?: string | null;
    status: string;
    expiresAt: Date | string;
    organizationId: string;
    organizationName?: string;
  }>;

  const members: OrganizationMemberView[] = (fullOrganization?.members ?? []).map(
    (item) => ({
      id: item.id,
      userId: item.userId,
      role: item.role,
      createdAt: toIso(item.createdAt),
      user: {
        id: item.user.id,
        name: item.user.name,
        email: item.user.email,
        image: item.user.image,
      },
    }),
  );

  const invitations: OrganizationInvitationView[] = (
    fullOrganization?.invitations ?? []
  ).map((item) => ({
    id: item.id,
    email: item.email,
    role: item.role ?? null,
    status: item.status,
    expiresAt: toIso(item.expiresAt),
    createdAt: toIso(item.createdAt),
  }));

  const activeOrganization: OrganizationDetailView | null = fullOrganization
    ? {
        id: fullOrganization.id,
        name: fullOrganization.name,
        slug: fullOrganization.slug,
        createdAt: toIso(fullOrganization.createdAt),
        members,
        invitations,
      }
    : null;

  return {
    organizations,
    activeOrganization,
    activeOrganizationId,
    currentUserId: session.user.id,
    currentUserEmail: session.user.email,
    incomingInvitations: incomingInvitations
      .filter((item) => item.status === "pending")
      .map(
        (item): UserInvitationView => ({
          id: item.id,
          email: item.email,
          role: item.role ?? null,
          status: item.status,
          expiresAt: toIso(item.expiresAt),
          organizationId: item.organizationId,
          organizationName: item.organizationName,
        }),
      ),
  };
}
