CREATE TABLE "request_log" (
	"id" text PRIMARY KEY NOT NULL,
	"request_headers_json" jsonb,
	"request_payload_json" jsonb,
	"response_headers_json" jsonb,
	"response_payload_json" jsonb,
	"logged_at" timestamp NOT NULL,
	"log_date" date NOT NULL,
	"created_at" timestamp DEFAULT NOW() NOT NULL,
	"updated_at" timestamp NOT NULL
) PARTITION BY RANGE (log_date);

--> partition by range for analytics
--> statement-breakpoint
CREATE INDEX "logged_at_idx" ON "request_log" USING btree ("logged_at");

--> statement-breakpoint
CREATE INDEX "created_at_idx" ON "request_log" USING btree ("created_at");