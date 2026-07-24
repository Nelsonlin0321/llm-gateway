# Anthropic Proxy for MiniMax

## Status

Implemented the `/anthropic/*` proxy path for the Anthropic-compatible MiniMax provider and added focused tests so this work can continue cleanly later.

## What Was Done

1. Confirmed the route already existed:
   - `POST /anthropic/*` is handled by `proxyToAnthropic` in `src/index.ts`
2. Verified provider-based routing was already wired:
   - model parsing uses `provider/model`
   - upstream URL building removes the local `/anthropic` prefix before forwarding
3. Fixed the Anthropic payload transformation:
   - incoming model like `minimax/MiniMax-M3`
   - forwarded upstream as `MiniMax-M3`
4. Identified and corrected the Anthropic MiniMax upstream base URL in `src/providers.ts`
5. Added automated tests for the Anthropic payload behavior

## Files Changed

- `src/payload-anthropic.ts`
- `src/providers.ts`
- `tests/payload-anthropic.test.ts`

## Behavior

Client request:

```json
{
  "model": "minimax/MiniMax-M3"
}
```

Gateway behavior:

- resolves provider `minimax`
- uses `MINIMAX_API_KEY`
- forwards to MiniMax Anthropic-compatible upstream
- rewrites the outgoing model to:

```json
{
  "model": "MiniMax-M3"
}
```

For the current provider config, a request such as:

```text
POST /anthropic/v1/messages
```

is forwarded to:

```text
<configured Anthropic MiniMax base URL>/v1/messages
```

## Verification

Ran:

```bash
npm test
```

Result:

- all tests passed
- new Anthropic payload tests passed

## Important Note

The root cause for the live test failure was an incorrect Anthropic MiniMax provider URL in `src/providers.ts`.

The OpenAI-compatible MiniMax provider in `src/providers.ts` still uses its own separate base URL:

```text
https://api.minimaxi.com/v1
```

That path is separate from the Anthropic-compatible route and was not part of the Anthropic proxy fix.

## Suggested Next Steps

1. Add live tests for `/anthropic/v1/messages`
2. Confirm whether the OpenAI-compatible MiniMax host should remain as currently configured
3. Add a small script under `scripts/` for manual Anthropic proxy smoke testing
