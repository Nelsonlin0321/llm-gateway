import { decryptApiKeyForProxy } from "../child-keys/crypto";
import prisma from "../lib/prisma";

export type ProviderCompatibility = "openai" | "anthropic";

export type ProviderLookupRecord = {
  name: string;
  apiUrl: string;
  encryptedApiKey: string;
  compatibilityType: ProviderCompatibility;
  isActive: boolean;
};

export type ResolvedProvider = {
  providerId: string;
  baseUrl: string;
  apiKey: string;
  compatibilityType: ProviderCompatibility;
};

export type ProviderLookup = {
  findByName(name: string): Promise<ProviderLookupRecord | null>;
};

export type ResolveProviderSuccess = {
  ok: true;
  value: ResolvedProvider;
};

export type ResolveProviderFailure = {
  ok: false;
  status: 400 | 403 | 502 | 503;
  error: {
    message: string;
    type: "invalid_request_error" | "server_error";
  };
};

export type ResolveProviderResult =
  | ResolveProviderSuccess
  | ResolveProviderFailure;

const defaultLookup: ProviderLookup = {
  async findByName(name: string): Promise<ProviderLookupRecord | null> {
    return prisma.lLMProvider.findFirst({
      where: { name },
      orderBy: { updatedAt: "desc" },
      select: {
        name: true,
        apiUrl: true,
        encryptedApiKey: true,
        compatibilityType: true,
        isActive: true,
      },
    });
  },
};

function resolutionFailure(
  status: ResolveProviderFailure["status"],
  message: string,
  type: ResolveProviderFailure["error"]["type"],
): ResolveProviderFailure {
  return {
    ok: false,
    status,
    error: { message, type },
  };
}

export async function resolveProvider(
  providerId: string,
  compatibilityType: ProviderCompatibility,
  lookup: ProviderLookup = defaultLookup,
): Promise<ResolveProviderResult> {
  let record: ProviderLookupRecord | null;

  try {
    record = await lookup.findByName(providerId);
  } catch {
    return resolutionFailure(
      503,
      "Unable to load provider configuration right now.",
      "server_error",
    );
  }

  if (!record) {
    return resolutionFailure(
      400,
      `Unknown provider "${providerId}".`,
      "invalid_request_error",
    );
  }

  if (!record.isActive) {
    return resolutionFailure(
      403,
      `Provider "${providerId}" is inactive.`,
      "invalid_request_error",
    );
  }

  if (record.compatibilityType !== compatibilityType) {
    return resolutionFailure(
      400,
      `Provider "${providerId}" is not available for the ${compatibilityType} API family.`,
      "invalid_request_error",
    );
  }

  if (record.apiUrl.trim() === "" || record.encryptedApiKey.trim() === "") {
    return resolutionFailure(
      502,
      `Provider "${providerId}" is misconfigured.`,
      "server_error",
    );
  }

  try {
    const apiKey = decryptApiKeyForProxy(record.encryptedApiKey);
    if (apiKey.trim() === "") {
      throw new Error("empty api key");
    }

    return {
      ok: true,
      value: {
        providerId: record.name,
        baseUrl: record.apiUrl,
        apiKey,
        compatibilityType: record.compatibilityType,
      },
    };
  } catch {
    return resolutionFailure(
      502,
      `Provider "${providerId}" is misconfigured.`,
      "server_error",
    );
  }
}
