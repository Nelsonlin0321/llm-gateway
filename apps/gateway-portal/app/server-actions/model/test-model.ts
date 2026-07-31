"use server";

import { and, desc, eq, gt, isNull, or } from "drizzle-orm";

import { requireSession } from "@/lib/auth-server";
import { decryptChildKey } from "@/lib/child-key/service";
import { db, childKeys, llmProviders, models } from "@/lib/db";

const DEFAULT_PROXY_API_URL = "http://localhost:8080";

export type TestModelResult =
  | {
      ok: true;
      message: string;
      status: number;
    }
  | {
      ok: false;
      error: string;
      status?: number;
    };

function getProxyBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_PROXY_API_URL?.trim();
  const base = configured && configured.length > 0
    ? configured
    : DEFAULT_PROXY_API_URL;
  return base.replace(/\/+$/, "");
}

function buildTestPayload(
  compatibilityType: "openai" | "anthropic",
  modelAlias: string,
  userEmail: string,
): Record<string, unknown> {
  if (compatibilityType === "openai") {
    return {
      model: modelAlias,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Keep answers brief.",
        },
        {
          role: "user",
          content: "Hi there!",
        },
      ],
      stream: false,
      metadata: {
        user_email: userEmail,
      },
    };
  }

  return {
    model: modelAlias,
    messages: [
      {
        role: "system",
        content: [
          {
            type: "text",
            text: "You are a helpful assistant. Keep answers brief.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Hi there!",
          },
        ],
      },
    ],
    metadata: {
      user_email: userEmail,
    },
  };
}

function testEndpointPath(
  compatibilityType: "openai" | "anthropic",
): string {
  return compatibilityType === "openai"
    ? "/openai/chat/completions"
    : "/anthropic/v1/messages";
}

function extractErrorMessage(bodyText: string, status: number): string {
  if (!bodyText.trim()) {
    return `Proxy returned HTTP ${status}.`;
  }

  try {
    const parsed = JSON.parse(bodyText) as {
      error?: { message?: unknown } | string;
      message?: unknown;
    };

    if (typeof parsed.error === "string" && parsed.error.trim()) {
      return parsed.error;
    }

    if (
      parsed.error &&
      typeof parsed.error === "object" &&
      typeof parsed.error.message === "string" &&
      parsed.error.message.trim()
    ) {
      return parsed.error.message;
    }

    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message;
    }
  } catch {
    // Fall through to truncated raw body.
  }

  const truncated =
    bodyText.length > 280 ? `${bodyText.slice(0, 280)}…` : bodyText;
  return `Proxy returned HTTP ${status}: ${truncated}`;
}

/**
 * Smoke-test a registered model via the gateway proxy using a decrypted
 * child API key. Runs entirely on the server so secrets never reach the browser.
 */
export async function testModel(modelId: string): Promise<TestModelResult> {
  const session = await requireSession();

  if (!modelId.trim()) {
    return { ok: false, error: "Model id is required." };
  }

  const [row] = await db
    .select({
      modelId: models.id,
      modelName: models.name,
      modelAlias: models.alias,
      providerId: llmProviders.id,
      compatibilityType: llmProviders.compatibilityType,
      creatorId: llmProviders.creatorId,
    })
    .from(models)
    .innerJoin(llmProviders, eq(models.providerId, llmProviders.id))
    .where(eq(models.id, modelId))
    .limit(1);

  if (!row) {
    return { ok: false, error: "Model not found." };
  }

  if (row.creatorId !== session.user.id) {
    return {
      ok: false,
      error: "You do not have permission to test this model.",
    };
  }

  const now = new Date();
  const [childKey] = await db
    .select({
      id: childKeys.id,
      key: childKeys.key,
      userEmail: childKeys.userEmail,
    })
    .from(childKeys)
    .where(
      and(
        eq(childKeys.creatorId, session.user.id),
        eq(childKeys.isActive, true),
        or(isNull(childKeys.expiresAt), gt(childKeys.expiresAt, now)),
      ),
    )
    .orderBy(desc(childKeys.updatedAt))
    .limit(1);

  if (!childKey) {
    return {
      ok: false,
      error:
        "No active child API key found. Create an active child key before testing models.",
    };
  }

  let apiKey: string;
  try {
    apiKey = decryptChildKey(childKey.key);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to decrypt a child API key for testing.";
    return { ok: false, error: message };
  }

  const baseUrl = getProxyBaseUrl();
  const url = `${baseUrl}${testEndpointPath(row.compatibilityType)}`;
  const payload = buildTestPayload(
    row.compatibilityType,
    row.modelAlias,
    childKey.userEmail,
  );

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      // Do not cache probe requests.
      cache: "no-store",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to reach the proxy.";
    return {
      ok: false,
      error: `Proxy request failed (${baseUrl}): ${message}`,
    };
  }

  const status = response.status;
  const success = status === 200 || status === 201;

  if (success) {
    return {
      ok: true,
      status,
      message: `Model “${row.modelName}” responded successfully (HTTP ${status}).`,
    };
  }

  let bodyText = "";
  try {
    bodyText = await response.text();
  } catch {
    bodyText = "";
  }

  return {
    ok: false,
    status,
    error: extractErrorMessage(bodyText, status),
  };
}
