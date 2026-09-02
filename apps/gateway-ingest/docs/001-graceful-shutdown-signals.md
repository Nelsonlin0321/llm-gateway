# Scheduled Worker invocations

This note explains how `gateway-ingest` runs on Cloudflare Workers.

The Worker entry is [`src/index.ts`](../src/index.ts):

```ts
export default {
  async scheduled(controller, env, ctx) {
    await handleIngestInvocation(env);
  },
  fetch: handleFetch,
};
```

## What is `scheduled()`?

Cloudflare Cron Triggers invoke the Worker on a time-based recurring schedule defined in `wrangler.jsonc`:

```jsonc
"triggers": {
  "crons": ["* * * * *"]
}
```

Each tick:

1. Cloudflare calls `scheduled(controller, env, ctx)`
2. Bindings (`vars` + secrets) are merged onto `process.env`
3. `runIngestJob` ensures the Redis consumer group and drains available stream entries
4. The invocation returns when the stream is empty, idle-exit fires, or `REQUEST_LOG_MAX_DURATION_MS` is reached

The next cron tick starts another drain. Leftover pending entries are reclaimed via `XAUTOCLAIM`.

## Why not SIGINT / SIGTERM?

Workers are not long-lived OS processes. Isolates start for an invocation and exit when the handler finishes. There is no `process.on("SIGTERM")` shutdown path.

Stop a local `wrangler dev` session with Ctrl+C in the terminal (Wrangler handles that). In production, pause or delete the Cron Trigger / Worker.

## Local trigger

```bash
bun run dev   # wrangler dev --test-scheduled
curl "http://localhost:8081/__scheduled?cron=*+*+*+*+*"
```

`GET /health` and `GET /ready` do not drain the stream.

## Practical effect

If a drain is cut off by max duration or an isolate timeout:

- already-ACKed entries stay loaded in Postgres
- un-ACKed entries remain in the consumer group PEL
- the next cron reclaims them after `REQUEST_LOG_CLAIM_MIN_IDLE_MS`
