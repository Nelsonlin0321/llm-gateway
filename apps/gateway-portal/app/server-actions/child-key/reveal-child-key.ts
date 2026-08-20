"use server";

import { eq } from "drizzle-orm";

import { requireSession } from "@/lib/auth-server";
import { decryptChildKey } from "@/lib/child-key/service";
import { db, childKeys } from "@/lib/db";
import {
  mutationDeniedMessage,
  requireOrganizationPermission,
} from "@/lib/organization/access";

export type RevealChildKeyResult =
  | {
      ok: true;
      id: string;
      name: string;
      apiKey: string;
    }
  | {
      ok: false;
      error: string;
    };

export async function revealChildKey(
  id: string,
): Promise<RevealChildKeyResult> {
  const session = await requireSession();

  if (!id.trim()) {
    return { ok: false, error: "Child key id is required." };
  }

  const [childKey] = await db
    .select({
      id: childKeys.id,
      name: childKeys.name,
      key: childKeys.key,
      organizationId: childKeys.organizationId,
    })
    .from(childKeys)
    .where(eq(childKeys.id, id))
    .limit(1);

  if (!childKey) {
    return { ok: false, error: "Child key not found." };
  }

  const access = await requireOrganizationPermission(
    session.user.id,
    childKey.organizationId,
    "childKey",
    "view",
  );

  if (!access.ok) {
    return { ok: false, error: mutationDeniedMessage(access) };
  }

  try {
    return {
      ok: true,
      id: childKey.id,
      name: childKey.name,
      apiKey: decryptChildKey(childKey.key),
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to decrypt the child API key.";
    return { ok: false, error: message };
  }
}
