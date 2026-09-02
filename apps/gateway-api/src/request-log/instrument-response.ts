import {
  parseErrorFieldsFromJsonText,
  parseErrorFieldsFromSseText,
  parseResponseIdFromJsonText,
  parseResponseIdFromSseText,
  resolveResponseMode,
} from "./parse-response.js";
import type { ResponseMode } from "./schema.js";

/** Hard cap for retained SSE text to bound memory. */
const STREAM_BUFFER_MAX_CHARS = 1_000_000;

export type InstrumentedResponseCapture = {
  statusCode: number;
  responseMode: ResponseMode;
  responseContentType: string;
  responseHeaders: Headers;
  /** Raw JSON body text. */
  responsePayloadJson?: string;
  /** Raw SSE transcript. */
  responseStreamText?: string;
  responseId?: string;
  errorType?: string;
  errorMessage?: string;
  firstTokenMs?: number;
  streamChunkCount?: number;
  completedAt: Date;
  durationMs: number;
};

export type InstrumentResponseOptions = {
  isStream: boolean;
  startedAtMs: number;
  /**
   * Called once the full response body has been observed (JSON fully read,
   * or SSE stream closed / errored). Must not throw into the client path.
   */
  onComplete: (capture: InstrumentedResponseCapture) => void;
};

function appendWithLimit(
  current: string,
  chunk: string,
  limit: number,
): string {
  if (current.length >= limit) {
    return current;
  }
  const remaining = limit - current.length;
  if (chunk.length <= remaining) {
    return current + chunk;
  }
  return `${current}${chunk.slice(0, remaining)}…[truncated]`;
}

function safeOnComplete(
  onComplete: InstrumentResponseOptions["onComplete"],
  capture: InstrumentedResponseCapture,
): void {
  try {
    onComplete(capture);
  } catch (error) {
    console.error("[request-log] onComplete failed", error);
  }
}

/**
 * Wrap an upstream Response so we can measure timing and capture body/SSE
 * text for request logging while still delivering bytes to the client.
 *
 * - JSON: buffers the body, rebuilds a Response, then invokes `onComplete`.
 * - SSE: pumps chunks through a TransformStream; `onComplete` after the stream ends.
 */
export async function instrumentUpstreamResponse(
  upstream: Response,
  options: InstrumentResponseOptions,
): Promise<Response> {
  const contentType = upstream.headers.get("content-type") ?? "";
  const responseMode = resolveResponseMode(options.isStream, contentType);
  const headers = new Headers(upstream.headers);

  if (responseMode === "json" || !upstream.body) {
    return instrumentJsonResponse(upstream, headers, contentType, options);
  }

  return instrumentSseResponse(upstream, headers, contentType, options);
}

async function instrumentJsonResponse(
  upstream: Response,
  headers: Headers,
  contentType: string,
  options: InstrumentResponseOptions,
): Promise<Response> {
  let bodyText = "";
  try {
    bodyText = await upstream.text();
  } catch {
    bodyText = "";
  }

  const completedAt = new Date();
  const durationMs = Math.max(0, completedAt.getTime() - options.startedAtMs);
  const errors = parseErrorFieldsFromJsonText(bodyText, upstream.status);
  const responseId = parseResponseIdFromJsonText(bodyText);

  safeOnComplete(options.onComplete, {
    statusCode: upstream.status,
    responseMode: "json",
    responseContentType: contentType,
    responseHeaders: headers,
    responsePayloadJson: bodyText || undefined,
    responseId,
    errorType: errors.errorType,
    errorMessage: errors.errorMessage,
    completedAt,
    durationMs,
  });

  return new Response(bodyText, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

function instrumentSseResponse(
  upstream: Response,
  headers: Headers,
  contentType: string,
  options: InstrumentResponseOptions,
): Response {
  const body = upstream.body;
  if (!body) {
    const completedAt = new Date();
    safeOnComplete(options.onComplete, {
      statusCode: upstream.status,
      responseMode: "sse",
      responseContentType: contentType,
      responseHeaders: headers,
      completedAt,
      durationMs: Math.max(0, completedAt.getTime() - options.startedAtMs),
      streamChunkCount: 0,
    });
    return new Response(null, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  }

  const decoder = new TextDecoder();
  let capturedText = "";
  let firstTokenMs: number | undefined;
  let streamChunkCount = 0;
  let finished = false;

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const reader = body.getReader();

  const finish = () => {
    if (finished) {
      return;
    }
    finished = true;

    const tail = decoder.decode();
    if (tail) {
      capturedText = appendWithLimit(
        capturedText,
        tail,
        STREAM_BUFFER_MAX_CHARS,
      );
    }

    const completedAt = new Date();
    const durationMs = Math.max(0, completedAt.getTime() - options.startedAtMs);
    const responseId = parseResponseIdFromSseText(capturedText);
    const errors = parseErrorFieldsFromSseText(capturedText, upstream.status);

    safeOnComplete(options.onComplete, {
      statusCode: upstream.status,
      responseMode: "sse",
      responseContentType: contentType,
      responseHeaders: headers,
      responseStreamText: capturedText || undefined,
      responseId,
      errorType: errors.errorType,
      errorMessage: errors.errorMessage,
      firstTokenMs,
      streamChunkCount,
      completedAt,
      durationMs,
    });
  };

  void (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        streamChunkCount += 1;
        if (firstTokenMs === undefined) {
          firstTokenMs = Math.max(0, Date.now() - options.startedAtMs);
        }
        if (value) {
          const text = decoder.decode(value, { stream: true });
          if (text) {
            capturedText = appendWithLimit(
              capturedText,
              text,
              STREAM_BUFFER_MAX_CHARS,
            );
          }
          await writer.write(value);
        }
      }
      await writer.close();
    } catch {
      try {
        await writer.abort();
      } catch {
        // ignore secondary abort errors
      }
    } finally {
      finish();
    }
  })();

  return new Response(readable, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}
