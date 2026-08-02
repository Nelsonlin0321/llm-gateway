ALTER TABLE "request_log" RENAME COLUMN "response_payload_json" TO "response_text";--> statement-breakpoint
ALTER TABLE "event_log" ADD COLUMN "first_token_ms" integer;