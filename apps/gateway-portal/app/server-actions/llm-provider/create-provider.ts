"use server";

import { eq, and } from "drizzle-orm";
import { z } from "zod";

import { db, llmProviders } from "@/lib/db";
import { requireSession } from "@/lib/auth-server";
import {
  buildProviderCreateData,
  toProviderListItem,
  validateCreateProviderInput,
} from "@/lib/llm-provider/service";
import { requireOrganizationPermission } from "@/lib/organization/access";
import { resolveActiveOrganizationId } from "@/lib/organization/service";

import {
  providerReturning,
  revalidateOrganizationProviderPaths,
  validationErrorResult,
  type ProviderActionResult,
} from "./shared";

export async function createProvider(
  input: unknown,
  organizationId?: string | null,
): Promise<ProviderActionResult> {
  const session = await requireSession();
  const resolvedOrganizationId =
    organizationId?.trim() ||
    (await resolveActiveOrganizationId(session));
  const access = await requireOrganizationPermission(
    session.user.id,
    resolvedOrganizationId,
    "llmProvider",
    "create",
  );

  if (!access.ok) {
    return validationErrorResult(
      access.code === "no_organization"
        ? "Select an organization before creating a provider."
        : access.error,
    );
  }

  const parsed = validateCreateProviderInput(input);

  if (!parsed.success) {
    return validationErrorResult(
      "Please fix the highlighted fields and try again.",
      z.flattenError(parsed.error).fieldErrors,
    );
  }

  const [duplicate] = await db
    .select({ id: llmProviders.id })
    .from(llmProviders)
    .where(
      and(
        eq(llmProviders.organizationId, access.organizationId),
        eq(llmProviders.name, parsed.data.name),
        eq(llmProviders.compatibilityType, parsed.data.compatibilityType),
      ),
    )
    .limit(1);

  if (duplicate) {
    return validationErrorResult(
      "A provider with this name and compatibility already exists.",
      { name: ["Choose a unique provider prefix for this compatibility."] },
    );
  }

  try {
    const [provider] = await db
      .insert(llmProviders)
      .values(
        buildProviderCreateData(parsed.data, session.user.id, access.organizationId),
      )
      .returning(providerReturning);

    revalidateOrganizationProviderPaths(access.organizationId);

    return {
      ok: true,
      provider: toProviderListItem(provider),
      message: "Provider created successfully.",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create the provider.";
    return validationErrorResult(message);
  }
}
