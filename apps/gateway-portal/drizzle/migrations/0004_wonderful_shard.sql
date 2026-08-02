ALTER TABLE
    "request_log"
ALTER COLUMN
    "request_headers_json"
SET
    DATA TYPE text;

--> statement-breakpoint
ALTER TABLE
    "request_log"
ALTER COLUMN
    "request_payload_json"
SET
    DATA TYPE text;

--> statement-breakpoint
ALTER TABLE
    "request_log"
ALTER COLUMN
    "response_headers_json"
SET
    DATA TYPE text;

ALTER TABLE
    "request_log"
ALTER COLUMN
    "response_text"
SET
    DATA TYPE text;