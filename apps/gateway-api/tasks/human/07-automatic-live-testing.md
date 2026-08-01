# Automatic live testing (bulk proxy matrix)

## Goal

Maintain a single live smoke-test script that exercises the gateway against **every model in the database**, for each configured gateway path, in both streaming and non-streaming modes.

**Script:** `apps/gateway-api/scripts/bulk-proxy-test.ts`

## Parameters

| Name | Current values | Notes |
|------|----------------|--------|
| `SUB_URLS` | `/anthropic/v1/messages`, `/openai/chat/completions` | Gateway path suffixes (not full URLs) |
| `STREAMS` | `true`, `false` | Each model is tested once per value |

Extend `SUB_URLS` when adding surfaces; each path needs a matching payload file (see below).

## Environment

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `DATABASE_URL` | yes | — | Load models via Drizzle |
| `CHILD_API_KEY` | yes | — | Plain `sk_…` child key for `Authorization` |
| `PROXY_BASE_URL` | no | `http://localhost:8080` | Gateway base (no trailing slash) |
| `FORMAT_RESPONSES` | no | `false` | When `true`, pretty-print JSON and convert SSE → JSONL on save |

CLI overrides (win over env): `--format` / `--no-format`.

Prerequisites: proxy running (`bun run dev` in `apps/gateway-api`).

## Compatibility type

Derived from the **first path segment** of each sub-URL:

- `/anthropic/v1/messages` → `anthropic`
- `/openai/chat/completions` → `openai`

Only `openai` and `anthropic` are valid.

## Model loading (Drizzle)

`model` has no compatibility column. Filter through the provider:

```text
models
  ⨝ llm_providers ON models.provider_id = llm_providers.id
WHERE llm_providers.compatibility_type = <compatible_type>
```

Use each row’s `models.alias` as the request `model` field (e.g. `minimax/MiniMax-M3`).

## Payload files

Located next to the script. Name = sub-URL with every `/` replaced by `-`, plus `.json`:

| Sub-URL | Payload file |
|---------|----------------|
| `/anthropic/v1/messages` | `scripts/-anthropic-v1-messages.json` |
| `/openai/chat/completions` | `scripts/-openai-chat-completions.json` |

For each request, clone the template and set:

- `model` → selected model alias  
- `stream` → current stream flag  

Anthropic templates must include `max_tokens` (API requirement).

## Request matrix (pseudo-code)

```text
for url in SUB_URLS:
  compatible_type = first path segment of url   # e.g. "anthropic"
  payload_template = read_json(payload_stem + ".json")  # leading "-" from leading "/"
  models = query aliases for compatible_type (see above)

  for stream in STREAMS:
    for model in models:
      body = { ...payload_template, model: model.alias, stream }
      POST  PROXY_BASE_URL + url
      headers:
        Content-Type: application/json
        Authorization: Bearer ${CHILD_API_KEY}
      print response body, status, ok
      save response under scripts/response/ (see below)
```

## Response files

Written to `apps/gateway-api/scripts/response/`.

| Mode | Extension | Content (`FORMAT_RESPONSES=false`, default) | Content (`FORMAT_RESPONSES=true` / `--format`) |
|------|-----------|---------------------------------------------|------------------------------------------------|
| non-stream | `.json` | Raw response body | Pretty-printed JSON when parseable |
| stream | `.jsonl` | Raw response body (typically SSE) | SSE `data:` payloads as one JSON object per line |

**Filename:** `{url-path}-{provider-name}-{model-name}.{json|jsonl}`

- `url-path`: sub-URL without leading `/`, remaining `/` → `-`  
  (`/anthropic/v1/messages` → `anthropic-v1-messages`)
- `provider-name` / `model-name`: split model alias on the first `/`  
  (`minimax/MiniMax-M3` → `minimax`, `MiniMax-M3`)

Examples:

- `anthropic-v1-messages-minimax-MiniMax-M3.json`
- `anthropic-v1-messages-minimax-MiniMax-M3.jsonl`
- `openai-chat-completions-minimax-MiniMax-M3.json`

## Expected output

- Per request: payload dump, save path, response text, status code, ok flag, latency  
- End: PASS/FAIL summary lines for every (url × stream × model), including saved path  
- Non-zero exit if any request fails or no models were found  


## How to run

```bash
cd apps/gateway-api
bun run scripts/bulk-proxy-test.ts              # raw bodies (default)
bun run scripts/bulk-proxy-test.ts --format    # pretty JSON / SSE→JSONL
FORMAT_RESPONSES=true bun run scripts/bulk-proxy-test.ts
```

## Extending

1. Add a path to `SUB_URLS` in `bulk-proxy-test.ts`.  
2. Add a sibling payload JSON named with `/` → `-`.  
3. Ensure providers for that API family exist in the DB with models and `compatibility_type` set correctly.
