# `requireChildKeyAuth` middleware explained

This note explains the Hono middleware in [`middleware.ts`](file:///Volumes/mnt/Workspace/llm-gateway/apps/gateway-api/src/child-keys/middleware.ts#L19-L31), especially:

- what `MiddlewareHandler<{ Variables: ... }>` means
- what `c` means
- what `next` means
- how `c.set(...)` is related to `Variables`

## The code

```ts
export const requireChildKeyAuth: MiddlewareHandler<{
  Variables: ChildKeyAuthVariables;
}> = async (c, next) => {
  const result = await authenticateChildApiKey(c.req.header("Authorization"));

  if (!result.ok) {
    return c.json({ error: result.error }, result.status as 401 | 403 | 503);
  }

  c.set("childKey", result.payload);
  c.set("childApiKey", result.plainApiKey);
  await next();
};
```

## 1. What is `MiddlewareHandler`?

According to the Hono official middleware guide, a middleware function:

- runs before and/or after a route handler
- should `await next()` to continue the chain
- or return a `Response` early to stop processing

That is exactly what this middleware does:

- if auth fails, it returns `c.json(...)` immediately
- if auth succeeds, it stores data on the context and calls `await next()`

Reference:

- [Hono Middleware Guide](https://hono.dev/docs/guides/middleware)

## 2. What does `MiddlewareHandler<{ Variables: ChildKeyAuthVariables }>` mean?

This part is TypeScript typing for the Hono context used by the middleware.

```ts
MiddlewareHandler<{
  Variables: ChildKeyAuthVariables;
}>;
```

It tells Hono:

- this middleware uses context variables
- those variables follow the `ChildKeyAuthVariables` type

In this file, `ChildKeyAuthVariables` is:

```ts
export type ChildKeyAuthVariables = {
  childKey: ChildKeyJwtPayload;
  childApiKey: string;
};
```

So the middleware is declaring that the request context can contain:

- `childKey`
- `childApiKey`

These are not automatically created by the type alone. The type only describes them. They are actually stored at runtime by:

```ts
c.set("childKey", result.payload);
c.set("childApiKey", result.plainApiKey);
```

This matches the Hono Context API docs for `set()` / `get()` and typed `Variables`.

Reference:

- [Hono Context API: set() / get()](https://hono.dev/api/context)

## 3. What is `c`?

`c` is the Hono `Context` object.

From the official docs, `Context` is the object used to handle request and response data.

In this middleware, `c` is used in three ways:

### Read request data

```ts
c.req.header("Authorization");
```

This reads the `Authorization` header from the incoming request.

Here:

- `c.req` is the Hono request object
- `.header("Authorization")` gets the header value

Reference:

- [Hono Context API: `req`](https://hono.dev/api/context)

### Return a response

```ts
return c.json({ error: result.error }, result.status as 401 | 403 | 503);
```

This sends a JSON response and stops the middleware chain.

Reference:

- [Hono Context API: `json()`](https://hono.dev/api/context)

### Store data for downstream handlers

```ts
c.set("childKey", result.payload);
c.set("childApiKey", result.plainApiKey);
```

This stores values on the current request context so later middleware or route handlers can read them.

Reference:

- [Hono Context API: `set()` / `get()`](https://hono.dev/api/context)

## 4. What is `next`?

`next` is the function that continues execution to the next middleware or the final route handler.

From the Hono middleware guide:

- call `await next()` if you want request processing to continue
- return a `Response` instead if you want to stop early

So in this middleware:

### Failure path

```ts
if (!result.ok) {
  return c.json({ error: result.error }, result.status as 401 | 403 | 503);
}
```

This does **not** call `next()`, so the request stops here.

### Success path

```ts
c.set("childKey", result.payload);
c.set("childApiKey", result.plainApiKey);
await next();
```

This means:

1. authenticate the child API key
2. save the verified values into context
3. continue to the next middleware/handler

Reference:

- [Hono Middleware Guide](https://hono.dev/docs/guides/middleware)

## 5. What does this middleware do in plain English?

This middleware is an authentication guard for routes that require a child API key.

Flow:

1. read the `Authorization` header
2. pass it to `authenticateChildApiKey(...)`
3. if invalid, return an error response immediately
4. if valid, store auth information in the request context
5. continue to the next handler

So its job is both:

- **protection**: reject unauthorized requests
- **context enrichment**: attach verified auth data for later code to use

## 6. Why use `Variables` here?

The main benefit is type safety.

Because the middleware declares:

```ts
Variables: ChildKeyAuthVariables;
```

the rest of the request pipeline can safely work with those context variables after this middleware runs.

Examples of downstream access in Hono are typically:

```ts
c.get("childKey");
c.get("childApiKey");
```

and in typed setups, Hono also supports access through:

```ts
c.var.childKey;
c.var.childApiKey;
```

The official docs show this pattern when middleware uses `c.set(...)` and later handlers read the stored values.

Reference:

- [Hono Context API: `var`](https://hono.dev/api/context)
- [Hono Middleware Guide: Extending the Context in Middleware](https://hono.dev/docs/guides/middleware)

## 7. Important nuance

`Variables` does **not** mean "local variables inside this function".

It means:

- extra values attached to the Hono request context
- values that are available throughout this request lifecycle
- values shared with downstream middleware/handlers

So this:

```ts
MiddlewareHandler<{
  Variables: ChildKeyAuthVariables;
}>;
```

is not defining JavaScript runtime variables by itself.

It is only defining the **TypeScript shape** of values that will later be placed into context by `c.set(...)`.

## 8. Mapping this exact code to Hono concepts

### Type declaration

```ts
MiddlewareHandler<{
  Variables: ChildKeyAuthVariables;
}>;
```

Meaning:

- this is a Hono middleware
- it works with typed context variables

### Middleware parameters

```ts
async (c, next) => { ... }
```

Meaning:

- `c`: Hono `Context`
- `next`: continue to next middleware/handler

### Read request header

```ts
c.req.header("Authorization");
```

Meaning:

- get the bearer token from the incoming request

### Early return on auth failure

```ts
return c.json({ error: result.error }, result.status as 401 | 403 | 503);
```

Meaning:

- stop the chain
- send JSON error response immediately

### Store verified auth data

```ts
c.set("childKey", result.payload);
c.set("childApiKey", result.plainApiKey);
```

Meaning:

- attach verified auth info to the request context

### Continue request processing

```ts
await next();
```

Meaning:

- pass control to the next middleware or route handler

## 9. Short summary

This middleware means:

- "For this request, validate the child API key first."
- "If invalid, return an error immediately."
- "If valid, store the verified child key data on Hono context."
- "Then continue to the real route handler."

## References

- [Hono Middleware Guide](https://hono.dev/docs/guides/middleware)
- [Hono Context API](https://hono.dev/api/context)
