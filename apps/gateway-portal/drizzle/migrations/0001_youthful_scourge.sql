ALTER TABLE "event_log" ADD COLUMN "total_token" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "request_log" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "request_log" ADD COLUMN "updated_at" timestamp NOT NULL;