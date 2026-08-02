import type { Context, MiddlewareHandler } from "hono";
import { proxy } from "hono/proxy";

import type { ChildKeyDbRecord } from "../child-keys/types.js";
import {
  emitRequestLog,
  getCaptureLevel,
  getOrCreateRequestId,
  instrumentUpstreamResponse,
  type EmitRequestLogInput,
  type EmitRequestLogResult,
  type InstrumentedResponseCapture,
  type RequestLogResponseCapture,
} from "../request-log/index.js";
import { buildCurlCommand, isUpstreamCurlLogEnabled } from "./curl";

export type UpstreamProxyContext = {
  // routing / request envelope (for request-log stream)
  gatewayPath: string;
  httpMethod: string;
  isStream: boolean;
  /** Original client JSON body, stringified (pre-rewrite). */
  requestPayloadJson: string;

  // downstream context
  provider: string;
  requestedModel: string;
  requestedModelAlias: string;
  apiFamily: string;
  metadataJson: string;

  // upstream context
  upstreamModel: string;
  upstreamUrl: string;
  masterApiKey: string;
  upstreamHeaders: Headers;
  upstreamBody: string;

  // child key context
  childKeyRecord: ChildKeyDbRecord;
};

export type UpstreamProxyVariables = {
  proxyContext: UpstreamProxyContext;
};

type ForwardUpstream = (input: string, init: RequestInit) => Promise<Response>;

export type EmitRequestLogFn = (
  input: EmitRequestLogInput,
) => Promise<EmitRequestLogResult>;

export type UpstreamProxyDependencies = {
  forwardUpstream?: ForwardUpstream;
  /** Injected for tests; defaults to best-effort Redis Stream emit. */
  emitRequestLog?: EmitRequestLogFn;
};

const defaultForwardUpstream: ForwardUpstream = (input, init) =>
  proxy(input, init);

function toResponseCapture(
  requestId: string,
  startedAt: Date,
  capture: InstrumentedResponseCapture,
): RequestLogResponseCapture {
  return {
    requestId,
    startedAt,
    completedAt: capture.completedAt,
    durationMs: capture.durationMs,
    statusCode: capture.statusCode,
    responseMode: capture.responseMode,
    responseContentType: capture.responseContentType,
    responseHeaders: capture.responseHeaders,
    responsePayloadJson: capture.responsePayloadJson,
    responseStreamText: capture.responseStreamText,
    responseId: capture.responseId,
    errorType: capture.errorType,
    errorMessage: capture.errorMessage,
    firstTokenMs: capture.firstTokenMs,
    streamChunkCount: capture.streamChunkCount,
  };
}

function scheduleEmit(
  emit: EmitRequestLogFn,
  input: EmitRequestLogInput,
): void {
  void emit(input).catch((error) => {
    console.error("[request-log] emitRequestLog rejected", error);
  });
}

export async function handleUpstreamProxy(
  c: Context,
  deps: UpstreamProxyDependencies,
): Promise<Response> {
  const ctx = (c as unknown as { get: (key: string) => unknown }).get(
    "proxyContext",
  ) as UpstreamProxyContext | undefined;

  if (!ctx) {
    return c.json(
      {
        error: {
          message: "Missing proxy context.",
          type: "server_error",
        },
      },
      500,
    );
  }

  const startedAt = new Date();
  const startedAtMs = startedAt.getTime();
  const requestId = getOrCreateRequestId(
    (c as unknown as { get: (key: string) => unknown }).get("requestId") as
      | string
      | undefined,
  );
  // Ensure downstream handlers / clients can see the correlation id.
  c.header("x-request-id", requestId);

  const emit = deps.emitRequestLog ?? emitRequestLog;
  const requestHeaders = c.req.raw.headers;
  const captureLevel = getCaptureLevel();
  const shouldLogUpstreamCurl = isUpstreamCurlLogEnabled();

  const emitWithResponse = (response: RequestLogResponseCapture) => {
    scheduleEmit(emit, {
      proxyContext: ctx,
      requestHeaders,
      response,
      captureLevel,
    });
  };

  try {
    if (shouldLogUpstreamCurl) {
      console.log(
        buildCurlCommand({
          url: ctx.upstreamUrl,
          method: c.req.method,
          headers: ctx.upstreamHeaders,
          body: ctx.upstreamBody,
          captureLevel,
        }),
      );
    }

    const upstream = await (deps.forwardUpstream ?? defaultForwardUpstream)(
      ctx.upstreamUrl,
      {
        method: c.req.method,
        headers: ctx.upstreamHeaders,
        body: ctx.upstreamBody,
      },
    );
    return await instrumentUpstreamResponse(upstream, {
      isStream: ctx.isStream,
      startedAtMs,
      captureLevel,
      onComplete: (capture) => {
        emitWithResponse(toResponseCapture(requestId, startedAt, capture));
      },
    });
  } catch {
    const completedAt = new Date();
    const errorMessage = `Failed to reach provider "${ctx.provider}".`;
    emitWithResponse({
      requestId,
      startedAt,
      completedAt,
      durationMs: Math.max(0, completedAt.getTime() - startedAtMs),
      statusCode: 502,
      responseMode: "json",
      responseContentType: "application/json",
      responseHeaders: {
        "content-type": "application/json",
      },
      responsePayloadJson: JSON.stringify({
        error: {
          message: errorMessage,
          type: "server_error",
        },
      }),
      errorType: "server_error",
      errorMessage,
    });

    return c.json(
      {
        error: {
          message: errorMessage,
          type: "server_error",
        },
      },
      502,
    );
  }
}

// MiddlewareHandler  is equivalent to (c: Context) => Promise<Response>;

export function createUpstreamProxyHandler(
  deps: UpstreamProxyDependencies = {},
): MiddlewareHandler {
  return (c) => handleUpstreamProxy(c, deps);
}
