const SLUG_MAX_LENGTH = 48;

export function slugifyOrganizationName(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/g, "");

  return slug || "workspace";
}

export function defaultOrganizationName(user: {
  name?: string | null;
  email: string;
}): string {
  const name = user.name?.trim();
  if (name) {
    return `${name}'s Workspace`;
  }

  const localPart = user.email.split("@")[0]?.trim();
  if (localPart) {
    return `${localPart}'s Workspace`;
  }

  return "My Workspace";
}

export function defaultOrganizationSlug(user: {
  id: string;
  name?: string | null;
  email: string;
}): string {
  const base = slugifyOrganizationName(
    user.name?.trim() || user.email.split("@")[0] || "workspace",
  );
  const suffix = user.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toLowerCase();
  return suffix ? `${base}-${suffix}` : `${base}-${Date.now().toString(36)}`;
}
