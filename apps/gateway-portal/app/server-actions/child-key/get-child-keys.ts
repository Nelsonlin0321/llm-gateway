"use server";

import { desc, eq } from "drizzle-orm";

import { requireSession } from "@/lib/auth-server";
import { toChildKeyListItem } from "@/lib/child-key/service";
import { db, childKeys } from "@/lib/db";

import { childKeyReturning } from "./shared";

export async function getChildKeys() {
  const session = await requireSession();

  const keys = await db
    .select(childKeyReturning)
    .from(childKeys)
    .where(eq(childKeys.creatorId, session.user.id))
    .orderBy(desc(childKeys.updatedAt));

  return keys.map(toChildKeyListItem);
}
