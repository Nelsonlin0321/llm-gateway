# 047 — Bulk proxy test: save responses as JSON/JSONL

## Summary of changes

`apps/gateway-api/scripts/bulk-proxy-test.ts` now writes each response under `scripts/response/`:

- **Filename:** `{url-path}-{provider-name}-{model-name}.json` (non-stream) or `.jsonl` (stream)
- **url-path:** gateway sub-URL with leading `/` stripped and remaining `/` → `-`
- **provider/model:** split from model alias (`provider/model`) on the first `/`
- Body written raw by default; optional formatting via `FORMAT_RESPONSES` env or `--format` / `--no-format` CLI
  - off (default): raw proxy body
  - on: pretty-print JSON (non-stream), SSE → JSONL (stream)
- File extension still depends only on stream mode (`.json` / `.jsonl`)

Also updated the human task note `tasks/human/07-automatic-live-testing.md` with the response file convention.

## Files touched

- `apps/gateway-api/scripts/bulk-proxy-test.ts`
- `apps/gateway-api/tasks/human/07-automatic-live-testing.md`
- `apps/gateway-api/tasks/ai/047-bulk-proxy-test-save-responses.md`

## How to verify

```bash
cd apps/gateway-api
bun run scripts/bulk-proxy-test.ts
ls scripts/response/
# expect e.g. anthropic-v1-messages-<provider>-<model>.json and .jsonl
```

## Follow-ups / next steps

- Optionally organize responses into stream=true / stream=false subfolders
- Gitignore `scripts/response/*` if artifacts should not be committed
