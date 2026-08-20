import type { Role as BetterAuthAccessRole } from "better-auth/plugins/access";

export const ORGANIZATION_CREATOR_ROLE = "root" as const;

export type Role = "root" | "admin" | "viewer" | "member";
export const roles = ["root", "admin", "viewer", "member"] as const;
export const defaultRole = "viewer" as const;

export type Entity =
  | "organization"
  | "llmProvider"
  | "model"
  | "childKey"
  | "member";
export type Operation = "create" | "delete" | "update" | "view";
export type Permission = Record<Entity, Operation[]>;
export type PermissionCheck = Partial<Record<Entity, Operation[]>>;

export const rolePermission: Record<Role, Permission> = {
  root: {
    organization: ["create", "delete", "update", "view"],
    llmProvider: ["create", "delete", "update", "view"],
    model: ["create", "delete", "update", "view"],
    childKey: ["create", "delete", "update", "view"],
    member: ["create", "delete", "update", "view"],
  },
  admin: {
    organization: ["create", "update", "view"],
    llmProvider: ["create", "delete", "update", "view"],
    model: ["create", "delete", "update", "view"],
    childKey: ["create", "delete", "update", "view"],
    member: ["create", "delete", "update", "view"],
  },
  viewer: {
    organization: ["view"],
    llmProvider: ["view"],
    model: ["view"],
    childKey: ["view"],
    member: ["view"],
  },
  member: {
    organization: ["create", "view"],
    llmProvider: ["view"],
    model: ["view"],
    childKey: [],
    member: ["view"],
  },
};

/** @deprecated Use `Role`. Kept so existing UI imports keep compiling. */
export type OrganizationRoleName = Role;
export const ORGANIZATION_ROLE_VALUES = roles;

export const ORGANIZATION_ROLE_LABELS: Record<Role, string> = {
  root: "Root",
  admin: "Admin",
  viewer: "Viewer",
  member: "Member",
};

export const ORGANIZATION_ROLE_DESCRIPTIONS: Record<Role, string> = {
  root: "Full access, including deleting the organization and removing members.",
  admin: "Can manage providers, models, keys, and members, but cannot delete the organization.",
  viewer: "Can view the organization and its resources, but cannot make changes.",
  member: "Can view organization details, providers, and models. Cannot manage child keys.",
};

const LEGACY_ROLE_ALIASES: Record<string, Role> = {
  owner: "root",
};

export function isRole(value: string): value is Role {
  return (roles as readonly string[]).includes(value);
}

export function normalizeRole(role: string): Role {
  const first = role.split(",")[0]?.trim().toLowerCase() ?? defaultRole;
  if (isRole(first)) {
    return first;
  }
  return LEGACY_ROLE_ALIASES[first] ?? defaultRole;
}

/** @deprecated Use `normalizeRole`. */
export function normalizeOrganizationRole(role: string): Role {
  return normalizeRole(role);
}

function resolveRole(role: string | null | undefined): Role | null {
  if (!role) {
    return null;
  }

  const first = role.split(",")[0]?.trim().toLowerCase() ?? "";
  if (isRole(first)) {
    return first;
  }
  return LEGACY_ROLE_ALIASES[first] ?? null;
}

/**
 * Central permission check. Source of truth is `rolePermission`.
 * Unknown or missing roles are denied.
 */
export function hasPermission(
  role: string | null | undefined,
  entity: Entity,
  operation: Operation,
): boolean {
  const resolved = resolveRole(role);
  if (!resolved) {
    return false;
  }

  return rolePermission[resolved][entity]?.includes(operation) ?? false;
}

export function roleHasPermission(
  role: string | null | undefined,
  permissions: PermissionCheck,
): boolean {
  return Object.entries(permissions).every(([entity, operations]) =>
    (operations ?? []).every((operation) =>
      hasPermission(role, entity as Entity, operation),
    ),
  );
}

export function assignableRolesFor(actorRole: string | null | undefined): Role[] {
  if (!hasPermission(actorRole, "member", "update")) {
    return [];
  }

  const role = resolveRole(actorRole);
  if (role === "root") {
    return [...roles];
  }
  if (role === "admin") {
    return roles.filter((value) => value !== "root");
  }
  return [];
}

/**
 * Maps Better Auth organization-plugin checks (invitation/member/organization)
 * onto `rolePermission` so those endpoints honor this table without using
 * Better Auth access control.
 */
function authorizeBetterAuthPermissions(
  role: Role,
  permissions: Record<string, string[]>,
): boolean {
  return Object.entries(permissions).every(([resource, actions]) =>
    (actions ?? []).every((action) => {
      const mapped = mapBetterAuthPermission(resource, action);
      return mapped
        ? hasPermission(role, mapped.entity, mapped.operation)
        : false;
    }),
  );
}

function mapBetterAuthPermission(
  resource: string,
  action: string,
): { entity: Entity; operation: Operation } | null {
  if (resource === "invitation") {
    if (action === "create") {
      return { entity: "member", operation: "create" };
    }
    if (action === "cancel") {
      return { entity: "member", operation: "delete" };
    }
    return null;
  }

  if (
    (resource === "organization" || resource === "member") &&
    (action === "create" ||
      action === "update" ||
      action === "delete" ||
      action === "view")
  ) {
    return { entity: resource, operation: action };
  }

  return null;
}

function betterAuthRole(role: Role): BetterAuthAccessRole {
  return {
    statements: rolePermission[role],
    authorize(request) {
      const permissions: Record<string, string[]> = {};
      for (const [resource, value] of Object.entries(request ?? {})) {
        if (!value) {
          continue;
        }
        const actions = Array.isArray(value)
          ? value
          : "actions" in value
            ? value.actions
            : [];
        permissions[resource] = [...actions];
      }

      return authorizeBetterAuthPermissions(role, permissions)
        ? { success: true }
        : { success: false, error: "unauthorized" };
    },
  };
}

/** Role objects for the Better Auth organization plugin, backed by `hasPermission`. */
export const organizationPluginRoles = {
  root: betterAuthRole("root"),
  admin: betterAuthRole("admin"),
  viewer: betterAuthRole("viewer"),
  member: betterAuthRole("member"),
  owner: betterAuthRole("root"),
};
