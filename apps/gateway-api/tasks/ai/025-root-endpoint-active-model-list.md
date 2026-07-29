# 025 — Root endpoint active model list

## Summary

- Completed the gateway `/` handler so it now reads active providers from Prisma instead of returning placeholder fields.
- Added grouped `openai-compatible` and `anthropic-compatible` arrays containing client-facing model identifiers in `provider/alias` format.
- Filtered results to active providers only and sourced aliases from the related `Model` rows, so the response reflects models that are currently usable through the gateway.

## Files touched

- `apps/gateway-api/src/index.ts`

## How to verify

- Start the gateway and request `GET /`.
- Confirm the JSON includes `openai-compatible` and `anthropic-compatible` arrays populated with values like `provider/model-alias`.
- Confirm inactive providers do not appear in either list.
