"use server";

import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import {
  buildProvidersWhereClause,
  toProviderListItem,
  validateGetProvidersOptions,
} from "@/lib/llm-provider/service";
import type { GetProvidersOptions } from "@/lib/llm-provider/schema";

import { providerSelect } from "./shared";

export async function getProviders(options?: GetProvidersOptions) {
  const session = await requireSession();
  const parsed = validateGetProvidersOptions(options);

  if (!parsed.success) {
    return [];
  }

  const providers = await prisma.lLMProvider.findMany({
    where: buildProvidersWhereClause(session.user.id, parsed.data),
    select: providerSelect,
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
  });

  return providers.map(toProviderListItem);
}
