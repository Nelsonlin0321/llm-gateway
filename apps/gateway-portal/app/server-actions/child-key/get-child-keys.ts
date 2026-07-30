"use server";

import { requireSession } from "@/lib/auth-server";
import { toChildKeyListItem } from "@/lib/child-key/service";
import prisma from "@/lib/prisma";

import { childKeySelect } from "./shared";

export async function getChildKeys() {
  const session = await requireSession();

  const keys = await prisma.childKey.findMany({
    where: { creatorId: session.user.id },
    select: childKeySelect,
    orderBy: [{ updatedAt: "desc" }],
  });

  return keys.map(toChildKeyListItem);
}
