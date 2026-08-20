import {
  hasPermission,
  normalizeRole,
  type Entity,
  type Operation,
  type Role,
} from "@/lib/organization/permissions";
import { getOrganizationMembership } from "@/lib/organization/service";

export type OrganizationAccess =
  | {
      ok: true;
      organizationId: string;
      role: Role;
      membershipId: string;
    }
  | {
      ok: false;
      error: string;
      code: "no_organization" | "not_member" | "forbidden";
    };

const MISSING_ORGANIZATION = "Select an organization before continuing.";
const NOT_A_MEMBER = "You do not have access to this organization.";
const FORBIDDEN = "You do not have permission to perform this action.";

/**
 * Load the user's membership and authorize `entity`/`operation` against
 * `rolePermission` via `hasPermission`.
 */
export async function requireOrganizationPermission(
  userId: string,
  organizationId: string | null | undefined,
  entity: Entity,
  operation: Operation,
): Promise<OrganizationAccess> {
  if (!organizationId) {
    return {
      ok: false,
      error: MISSING_ORGANIZATION,
      code: "no_organization",
    };
  }

  const membership = await getOrganizationMembership(userId, organizationId);
  if (!membership) {
    return { ok: false, error: NOT_A_MEMBER, code: "not_member" };
  }

  if (!hasPermission(membership.role, entity, operation)) {
    return { ok: false, error: FORBIDDEN, code: "forbidden" };
  }

  return {
    ok: true,
    organizationId,
    role: normalizeRole(membership.role),
    membershipId: membership.id,
  };
}

export async function getOrganizationRole(
  userId: string,
  organizationId: string | null | undefined,
): Promise<Role | null> {
  if (!organizationId) {
    return null;
  }

  const membership = await getOrganizationMembership(userId, organizationId);
  return membership ? normalizeRole(membership.role) : null;
}

export function mutationDeniedMessage(access: Extract<OrganizationAccess, { ok: false }>) {
  if (access.code === "not_member") {
    return "Resource not found.";
  }
  return access.error;
}
