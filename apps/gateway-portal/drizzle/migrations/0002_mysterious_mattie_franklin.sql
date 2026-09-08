CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"actor_user_id" text,
	"actor_email" text NOT NULL,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dead_event_log" (
	"event_id" text NOT NULL,
	"request_id" text NOT NULL,
	"log_date" date NOT NULL,
	"organization_id" text NOT NULL,
	"stream_id" text NOT NULL,
	"failure_reason" text NOT NULL,
	"failure_count" integer NOT NULL,
	"dead_lettered_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dead_event_log_organization_id_log_date_event_id_pk" PRIMARY KEY("organization_id","log_date","event_id")
);
--> statement-breakpoint
CREATE TABLE "dead_request_log" (
	"event_id" text NOT NULL,
	"request_id" text NOT NULL,
	"log_date" date NOT NULL,
	"organization_id" text NOT NULL,
	"request_payload_json" text,
	"response_text" text,
	"stream_id" text NOT NULL,
	"failure_reason" text NOT NULL,
	"failure_count" integer NOT NULL,
	"dead_lettered_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dead_request_log_organization_id_event_id_log_date_pk" PRIMARY KEY("organization_id","event_id","log_date")
);
--> statement-breakpoint
ALTER TABLE "child_key" ADD COLUMN "rate_limit_rpm" integer;--> statement-breakpoint
ALTER TABLE "child_key" ADD COLUMN "monthly_budget_usd" double precision;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_organization_id_idx" ON "audit_log" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "dead_event_log_stream_id_idx" ON "dead_event_log" USING btree ("stream_id");--> statement-breakpoint
CREATE INDEX "dead_request_log_stream_id_idx" ON "dead_request_log" USING btree ("stream_id");--> statement-breakpoint
CREATE INDEX "child_key_organization_id_idx" ON "child_key" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "member_organizationId_userId_key" ON "member" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "model_organization_id_alias_key" ON "model" USING btree ("organization_id","alias");