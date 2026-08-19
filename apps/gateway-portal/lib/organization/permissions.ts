export const ORGANIZATION_CREATOR_ROLE = "root" as const;

export type Role = "root" | "admin" | "viewer" | "member";
export const roles = ["root", "admin", "viewer", "member"] as const;
export const defaultRole = "viewer" as const;
type Entity = "organization" | "llmProvider" | "model" | "childKey" | "member";

type Operation = "create" | "delete" | "update" | "view";

type Permission = Record<Entity, Operation[]>;

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
    organization: ["view"],
    llmProvider: ["view"],
    model: ["view"],
    childKey: [],
    member: ["view"],
  },
};
