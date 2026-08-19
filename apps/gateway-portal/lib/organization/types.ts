import type { OrganizationListItem } from "@/lib/organization/service";

export type OrganizationMemberView = {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
};

export type OrganizationInvitationView = {
  id: string;
  email: string;
  role: string | null;
  status: string;
  expiresAt: string;
  createdAt: string;
};

export type UserInvitationView = {
  id: string;
  email: string;
  role: string | null;
  status: string;
  expiresAt: string;
  organizationId: string;
  organizationName?: string;
};

export type OrganizationDetailView = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  members: OrganizationMemberView[];
  invitations: OrganizationInvitationView[];
};

export type OrganizationWorkspaceState = {
  organizations: OrganizationListItem[];
  activeOrganization: OrganizationDetailView | null;
  activeOrganizationId: string | null;
  currentUserId: string;
  currentUserEmail: string;
  incomingInvitations: UserInvitationView[];
};

export type InvitationPreview = {
  id: string;
  email: string;
  role: string | null;
  status: string;
  expiresAt: string;
  organizationName: string;
};
