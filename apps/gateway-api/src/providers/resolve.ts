import { decryptApiKeyForProxy } from "../child-keys/crypto";
import { redis_cache } from "../lib/redis-client";
import { getProviderModelCacheKey } from "../lib/redis-keys";
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
  findByName(
    name: string,
    compatibilityType: ProviderCompatibility,
    creatorId: string,
  ): Promise<ProviderLookupRecord | null>;
};

export type ResolvedProviderModel = ResolvedProvider & {
  modelAlias: string;
  model: string;
};

export type ProviderModelLookupRecord = {
  llmProvider: ProviderLookupRecord;
  llmModel: {
    alias: string;
    name: string;
  };
};

export type ProviderModelLookup = {
  findByNameAndAlias(
    name: string,
    modelAlias: string,
    compatibilityType: ProviderCompatibility,
    creatorId: string,
  ): Promise<ProviderModelLookupRecord | null>;
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
  async findByName(
    name: string,
    compatibilityType: ProviderCompatibility,
    creatorId: string,
  ): Promise<ProviderLookupRecord | null> {
    return prisma.lLMProvider.findFirst({
      where: { name, compatibilityType, creatorId },
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

const defaultProviderModelLookup: ProviderModelLookup = {
  async findByNameAndAlias(
    name: string,
    modelAlias: string,
    compatibilityType: ProviderCompatibility,
    creatorId: string,
  ): Promise<ProviderModelLookupRecord | null> {
    const query = () =>
      prisma.model.findFirst({
        where: {
          alias: `${name}/${modelAlias}`,
          provider: { name, compatibilityType, creatorId },
        },
        orderBy: { updatedAt: "desc" },
        select: {
          alias: true,
          name: true,
          provider: {
            select: {
              name: true,
              apiUrl: true,
              encryptedApiKey: true,
              compatibilityType: true,
              isActive: true,
            },
          },
        },
      });

    const llmAndModel = await redis_cache(
      getProviderModelCacheKey({
        providerName: name,
        compatibilityType,
        modelAlias,
        creatorId,
        application: "gateway-api",
      }),
      query,
    );

    if (!llmAndModel) {
      return null;
    }

    return {
      llmProvider: llmAndModel.provider,
      llmModel: {
        alias: llmAndModel.alias,
        name: llmAndModel.name,
      },
    };
  },
};

// const originalFindFirst = prisma.model.findFirst;

// function shouldBypassProviderModelCache(): boolean {
//   return process.env.NODE_ENV === "test";
// }

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

export type ResolveProviderModelSuccess = {
  ok: true;
  value: ResolvedProviderModel;
};

export type ResolveProviderModelResult =
  | ResolveProviderModelSuccess
  | ResolveProviderFailure;

export async function resolveProviderModel(
  providerName: string,
  modelAlias: string,
  compatibilityType: ProviderCompatibility,
  creatorId: string,
  lookup: ProviderModelLookup = defaultProviderModelLookup,
  providerLookup: ProviderLookup = defaultLookup,
): Promise<ResolveProviderModelResult> {
  let record: ProviderModelLookupRecord | null;

  try {
    record = await lookup.findByNameAndAlias(
      providerName,
      modelAlias,
      compatibilityType,
      creatorId,
    );
  } catch {
    return resolutionFailure(
      503,
      "Unable to load provider configuration right now.",
      "server_error",
    );
  }

  if (!record) {
    let providerRecord: ProviderLookupRecord | null;
    try {
      providerRecord = await providerLookup.findByName(
        providerName,
        compatibilityType,
        creatorId,
      );
    } catch {
      return resolutionFailure(
        503,
        "Unable to load provider configuration right now.",
        "server_error",
      );
    }

    if (!providerRecord) {
      return resolutionFailure(
        400,
        `Unknown provider "${providerName}".`,
        "invalid_request_error",
      );
    }

    return resolutionFailure(
      400,
      `Unknown model "${providerName}/${modelAlias}".`,
      "invalid_request_error",
    );
  }

  if (!record.llmProvider.isActive) {
    return resolutionFailure(
      403,
      `Provider "${providerName}" is inactive.`,
      "invalid_request_error",
    );
  }

  if (record.llmProvider.compatibilityType !== compatibilityType) {
    return resolutionFailure(
      400,
      `Provider "${providerName}" is not available for the ${compatibilityType} API family.`,
      "invalid_request_error",
    );
  }

  if (
    record.llmProvider.apiUrl.trim() === "" ||
    record.llmProvider.encryptedApiKey.trim() === ""
  ) {
    return resolutionFailure(
      502,
      `Provider "${providerName}" is misconfigured.`,
      "server_error",
    );
  }

  try {
    const apiKey = decryptApiKeyForProxy(record.llmProvider.encryptedApiKey);
    if (apiKey.trim() === "") {
      throw new Error("empty api key");
    }

    return {
      ok: true,
      value: {
        providerId: record.llmProvider.name,
        baseUrl: record.llmProvider.apiUrl,
        apiKey,
        compatibilityType: record.llmProvider.compatibilityType,
        modelAlias,
        model: record.llmModel.name,
      },
    };
  } catch {
    return resolutionFailure(
      502,
      `Provider "${providerName}" is misconfigured.`,
      "server_error",
    );
  }
}
