"use server";

import { eq } from "drizzle-orm";

import { requireSession } from "@/lib/auth-server";
import { decryptChildKey } from "@/lib/child-key/service";
import { db, childKeys } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import {
  mutationDeniedMessage,
  requireOrganizationPermission,
} from "@/lib/organization/access";
import { publicMutationError } from "@/lib/safe-error";

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
    const apiKey = decryptChildKey(childKey.key);
    await writeAuditLog({
      organizationId: childKey.organizationId,
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      action: "reveal",
      entity: "childKey",
      entityId: childKey.id,
    });
    return {
      ok: true,
      id: childKey.id,
      name: childKey.name,
      apiKey,
    };
  } catch (error) {
    return {
      ok: false,
      error: publicMutationError("Unable to decrypt the child API key.", error),
    };
  }
}
