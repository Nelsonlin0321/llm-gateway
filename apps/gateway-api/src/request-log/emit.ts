import { getRedisClient, type RedisCacheClient } from "../lib/redis-client.js";
import { REQUEST_LOG_STREAM } from "../lib/redis-keys.js";
import { buildRequestLogFields, requestLogFieldsToXaddArgs } from "./build.js";
import type {
  RequestLogResponseCapture,
  RequestLogV1Fields,
} from "./schema.js";
import type { UpstreamProxyContext } from "../proxy/upstream-proxy.js";

/**
 * Structural snapshot of proxy handoff data needed for request-log emit.
 * Kept free of imports from `proxy/*` to avoid circular dependencies.
 */
// export type RequestLogProxySnapshot = {
//   gatewayPath: string;
//   httpMethod: string;
//   isStream: boolean;
//   requestPayloadJson: string;
//   provider: string;
//   requestedModel: string;
//   requestedModelAlias: string;
//   apiFamily: string;
//   metadataJson: string;
//   upstreamModel: string;
//   upstreamUrl: string;
//   upstreamBody: string;
//   childKeyRecord: {
//     id: string;
//     name: string;
//     creatorId: string;
//     userEmail: string;
//     issuedAt: number;
//     tags: unknown;
//   };
// };

export type EmitRequestLogInput = {
  proxyContext: UpstreamProxyContext;
  // requestHeaders: Headers | Record<string, string>;
  response: RequestLogResponseCapture;
  streamKey?: string;
  streamMaxLen?: number;
  client?: RedisCacheClient | null;
};

export type EmitRequestLogResult =
  | { ok: true; streamId: string; fields: RequestLogV1Fields }
  | { ok: false; reason: "no_client" | "xadd_failed"; error?: unknown };

const DEFAULT_REQUEST_LOG_STREAM_MAXLEN = 10_000;

export function getRequestLogStreamMaxLen(
  env: NodeJS.ProcessEnv = process.env,
): number {
  const value = (env.REQUEST_LOG_STREAM_MAXLEN ?? "").trim();
  const parsed = Number(value);
  return parsed > 0 ? parsed : DEFAULT_REQUEST_LOG_STREAM_MAXLEN;
}

/**
 * Best-effort publish of a request-log entry to the Redis Stream buffer.
 * Never throws — emit failures must not affect the client response.
 */
export async function emitRequestLog(
  input: EmitRequestLogInput,
): Promise<EmitRequestLogResult> {
  const client = input.client !== undefined ? input.client : getRedisClient();

  if (!client) {
    return { ok: false, reason: "no_client" };
  }

  const ctx = input.proxyContext;
  const fields = buildRequestLogFields({
    gatewayPath: ctx.gatewayPath,
    httpMethod: ctx.httpMethod,
    apiFamily: ctx.apiFamily,
    providerId: ctx.providerId,
    provider: ctx.provider,
    requestedModel: ctx.requestedModel,
    requestedModelAlias: ctx.requestedModelAlias,
    upstreamModel: ctx.upstreamModel,
    upstreamUrl: ctx.upstreamUrl,
    inputPrice: ctx.inputPrice,
    outputPrice: ctx.outputPrice,
    inputCachePrice: ctx.inputCachePrice,
    isStream: ctx.isStream,
    childKeyId: ctx.childKeyRecord.id,
    childKeyName: ctx.childKeyRecord.name,
    childKeyCreatorId: ctx.childKeyRecord.creatorId,
    childKeyIssuedAt: ctx.childKeyRecord.issuedAt,
    childKeyTags: ctx.childKeyRecord.tags,
    userEmail: ctx.childKeyRecord.userEmail,
    // requestHeaders: input.requestHeaders,
    requestPayloadJson: ctx.requestPayloadJson,
    metadataJson: ctx.metadataJson,
    upstreamRequestPayloadJson: ctx.upstreamBody,
    response: input.response,
  });

  const streamKey = input.streamKey ?? REQUEST_LOG_STREAM;
  const xaddArgs = requestLogFieldsToXaddArgs(fields);
  const streamMaxLen = input.streamMaxLen ?? getRequestLogStreamMaxLen();
  const xaddCommandArgs: (string | Buffer | number)[] = streamMaxLen
    ? ["MAXLEN", "~", streamMaxLen, "*", ...xaddArgs]
    : ["*", ...xaddArgs];

  try {
    const streamId = await client.xadd(streamKey, ...xaddCommandArgs);
    console.log(`StreamId:${streamId} has been logged to redis stream`);
    return { ok: true, streamId, fields };
  } catch (error) {
    console.error(
      "[request-log] failed to XADD request log to Redis Stream",
      error,
    );
    return { ok: false, reason: "xadd_failed", error };
  }
}
