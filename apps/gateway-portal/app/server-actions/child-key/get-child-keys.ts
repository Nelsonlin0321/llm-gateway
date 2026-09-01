"use server";

import { desc, eq } from "drizzle-orm";

import { requireSession } from "@/lib/auth-server";
import { toChildKeyListItem } from "@/lib/child-key/service";
import { db, childKeys } from "@/lib/db";
import { requireOrganizationPermission } from "@/lib/organization/access";
import { resolveActiveOrganizationId } from "@/lib/organization/service";

import { childKeyReturning } from "./shared";

export async function getChildKeys(organizationId?: string | null) {
  const session = await requireSession();
  const resolvedOrganizationId =
    organizationId?.trim() ||
    (await resolveActiveOrganizationId(session));
  const access = await requireOrganizationPermission(
    session.user.id,
    resolvedOrganizationId,
    "childKey",
    "view",
  );

  if (!access.ok) {
    return [];
  }

  const keys = await db
    .select(childKeyReturning)
    .from(childKeys)
    .where(eq(childKeys.organizationId, access.organizationId))
    .orderBy(desc(childKeys.updatedAt));

  return keys.map(toChildKeyListItem);
}
