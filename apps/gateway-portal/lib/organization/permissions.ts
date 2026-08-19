import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/organization/access";

export const organizationStatements = {
  ...defaultStatements,
} as const;

export const ac = createAccessControl(organizationStatements);

/** Full access, including destructive actions. Assigned to organization creators. */
export const rootRole = ac.newRole({
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
  team: ["create", "update", "delete"],
  ac: ["create", "read", "update", "delete"],
});

/** Can create and edit, but cannot delete organizations, members, teams, or roles. */
export const adminRole = ac.newRole({
  organization: ["update"],
  member: ["create", "update"],
  invitation: ["create", "cancel"],
  team: ["create", "update"],
  ac: ["create", "read", "update"],
});

/** Read-only access to the organization. */
export const viewerRole = ac.newRole({
  organization: [],
  member: [],
  invitation: [],
  team: [],
  ac: ["read"],
});

export const organizationRoles = {
  root: rootRole,
  admin: adminRole,
  viewer: viewerRole,
};

export const ORGANIZATION_CREATOR_ROLE = "root" as const;

export const ORGANIZATION_ROLE_VALUES = ["root", "admin", "viewer"] as const;

export type OrganizationRoleName = (typeof ORGANIZATION_ROLE_VALUES)[number];

export const ORGANIZATION_ROLE_LABELS: Record<OrganizationRoleName, string> = {
  root: "Root",
  admin: "Admin",
  viewer: "Viewer",
};

export const ORGANIZATION_ROLE_DESCRIPTIONS: Record<
  OrganizationRoleName,
  string
> = {
  root: "Full access, including deleting the organization and removing members.",
  admin: "Can edit organization settings and members, but cannot delete.",
  viewer: "Can view the organization, members, and invitations.",
};

const LEGACY_ROLE_ALIASES: Record<string, OrganizationRoleName> = {
  owner: "root",
  member: "viewer",
};

export function normalizeOrganizationRole(role: string): OrganizationRoleName {
  const first = role.split(",")[0]?.trim().toLowerCase() ?? "viewer";
  if (first === "root" || first === "admin" || first === "viewer") {
    return first;
  }
  return LEGACY_ROLE_ALIASES[first] ?? "viewer";
}

export function assignableRolesFor(actorRole: string): OrganizationRoleName[] {
  const role = normalizeOrganizationRole(actorRole);
  if (role === "root") {
    return ["root", "admin", "viewer"];
  }
  if (role === "admin") {
    return ["admin", "viewer"];
  }
  return [];
}

export function roleHasPermission(
  role: string,
  permissions: Parameters<(typeof rootRole)["authorize"]>[0],
): boolean {
  return role
    .split(",")
    .map((value) => normalizeOrganizationRole(value))
    .some((name) => organizationRoles[name].authorize(permissions).success);
}
