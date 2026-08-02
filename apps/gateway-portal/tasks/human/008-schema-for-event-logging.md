table 1 with request and response payload and header only:

```yaml
request_id: string // Primary Key as id field.
request_headers_json: json
request_payload_json: Json
response_headers_json: Json
response_payload_json: Json
logged_at: datetime
logdate:date
PARTITION BY RANGE (logdate);
```

```yaml
schema_version: integer
event_type: string
event_id: string
request_id: string // Primary Key as id field.
started_at: datetime
completed_at: datetime
gateway_path: string
http_method: string
api_family: string
provider_id: string // refer to the id of LLM Provider table
provider: string
requested_model: string
requested_model_alias: string
upstream_model: string
upstream_url: string
is_stream: boolean
response_mode: string
child_key_id: string // refer to the id of child key table
child_key_name: string
child_key_creator_id: string // refer to the id of user table
child_key_issued_at: integer
child_key_tags_json: Json
user_email: string
metadata_json: Json
capture_level: string
status_code: integer
response_content_type: string
duration_ms: integer
response_id: string
input_token: integer
output_token: integer,
cached_input_token: integer
cost: float,
logged_at: datetime,
log_date:date
created_at: datetime,
updated_at:datetime,

primary key (id (request_id),log_date)
```

Example:
schema_version
1
event_type
request_log
event_id
44131f3b-5767-45b7-b664-541cf07e48f2
request_id
cd6cc5ec-fbcc-4cae-8fd5-acbc5248c06e
logged_at
2026-07-31T19:23:36.090Z
started_at
2026-07-31T19:23:32.792Z
completed_at
2026-07-31T19:23:36.090Z
gateway_path
/openai/chat/completions
http_method
POST
api_family
openai
provider_id
12370502-1442-4ef7-99e9-b1c7b4e73a23
provider
openrouter
requested_model
glm-5.2
requested_model_alias
openrouter/glm-5.2
upstream_model
z-ai/glm-5.2
upstream_url
https://openrouter.ai/api/v1/chat/completions
is_stream
false
response_mode
json
child_key_id
26055153-6b4f-4738-b02a-892899d479bb
child_key_name
team-growth-prod
child_key_creator_id
QEQQKBJfSHaJcx0oQu4tIfChoKHivBic
child_key_issued_at
1785498287
child_key_tags_json
{"env":"test"}
user_email
nelsonlin0321@gmail.com
request_headers_json
{"accept":"_/_","accept-encoding":"gzip, deflate, br, zstd","connection":"keep-alive","content-length":"220","content-type":"application/json","host":"localhost:8080","user-agent":"Bun/1.3.14"}
metadata_json
{"user_email":"user@example.com"}
capture_level
full
status_code
200
response_content_type
application/json
response_headers_json
{"access-control-allow-origin":"_","access-control-expose-headers":"X-Generation-Id,X-Provider-Name,cf-ray","cf-ray":"a23efa6bcf1d2a98-LAX","content-type":"application/json","date":"Fri, 31 Jul 2026 19:23:33 GMT","permissions-policy":"payment=(self \"https://checkout.stripe.com\" \"https://connect-js.stripe.com\" \"https://js.stripe.com\" \"https://_.js.stripe.com\" \"https://hooks.stripe.com\")","referrer-policy":"no-referrer, strict-origin-when-cross-origin","server":"cloudflare","x-content-type-options":"nosniff","x-generation-id":"gen-1785525813-XKHH8dJXgVIMig1k0M8z"}
duration_ms
3298
request_payload_json
{"a":"b"}
response_payload_json
{"a":"b"}
response_id
gen-1785525813-XKHH8dJXgVIMig1k0M8z
