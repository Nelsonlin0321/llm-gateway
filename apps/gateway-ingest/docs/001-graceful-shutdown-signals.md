# Graceful shutdown via `SIGINT` / `SIGTERM` explained

This note explains the signal handlers in [`src/index.ts`](../src/index.ts), especially this part:

```ts
process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
```

## What are `SIGINT` and `SIGTERM`?

They are operating system “signals” sent to a process to ask it to stop.

- `SIGINT` typically means “interrupt”.
  - Most commonly triggered when you press Ctrl+C in a terminal running the process.
- `SIGTERM` typically means “terminate”.
  - Commonly sent by process managers and container orchestrators (Docker/Kubernetes/systemd) when they want your service to stop gracefully.

## What does `process.on("SIGINT" | "SIGTERM", ...)` do?

`process.on(...)` registers an event handler on the Bun/Node-compatible `process` object.

When the runtime receives a matching signal:

1. it emits the corresponding event (`"SIGINT"` or `"SIGTERM"`)
2. the provided callback runs
3. the callback triggers application shutdown

If you do not register signal handlers, the runtime may terminate the process immediately (which can leave Redis connections open and can interrupt in-flight work).

## Why call `shutdown(...)` from both signals?

It provides one unified graceful shutdown path, regardless of how the process is being stopped:

- local dev: Ctrl+C (`SIGINT`)
- production: service stop or container stop (`SIGTERM`)

## What does `void shutdown("SIGINT")` mean?

`shutdown(...)` is an async function, so it returns a `Promise`.

The `void` operator:

- intentionally discards that `Promise` (fire-and-forget)
- makes it explicit that the callback is not awaiting the result
- avoids “unhandled promise” / “floating promise” lint warnings in many setups

This pattern is common inside event handlers, where you want to trigger async cleanup but there is no upstream caller that can `await` the handler.

## What does `shutdown(signal)` actually do?

In [`src/index.ts`](../src/index.ts), `shutdown`:

1. ensures it runs only once using the `stopping` flag
2. logs the reason (signal or idle-exit)
3. tries to gracefully close Redis with `await client.quit()`
4. falls back to `client.disconnect()` if `quit()` throws
5. exits the process with success code `0`

The `stopping` flag is also used by the consume loop (`src/consume-loop.ts`):

- the loop condition is `while (!isStopping())`
- after shutdown starts, the loop stops scheduling new `XREADGROUP` calls
- `REQUEST_LOG_IDLE_EXIT_MS` can also end a drain and then calls this same shutdown path (outside orchestration starts the next run)

## Practical effect

If you stop `gateway-ingest`:

- it stops reading new Redis Stream messages
- it asks Redis to close the connection cleanly
- it then exits quickly and predictably
