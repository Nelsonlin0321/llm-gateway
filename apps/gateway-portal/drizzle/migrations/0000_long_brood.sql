CREATE TYPE "public"."compatibility_type" AS ENUM('openai', 'anthropic');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "child_key" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"key" text NOT NULL,
	"creator_id" text NOT NULL,
	"user_email" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"tags" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"organization_id" text NOT NULL,
	"expires_at" timestamp,
	"issued_at" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_log" (
	"event_id" text NOT NULL,
	"request_id" text NOT NULL,
	"schema_version" integer NOT NULL,
	"event_type" text NOT NULL,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"gateway_path" text NOT NULL,
	"http_method" text NOT NULL,
	"api_family" "compatibility_type" NOT NULL,
	"provider_id" text,
	"provider" text NOT NULL,
	"requested_model" text NOT NULL,
	"requested_model_alias" text NOT NULL,
	"upstream_model" text NOT NULL,
	"upstream_url" text NOT NULL,
	"is_stream" boolean DEFAULT false NOT NULL,
	"response_mode" text NOT NULL,
	"child_key_id" text,
	"child_key_name" text NOT NULL,
	"child_key_creator_id" text,
	"child_key_issued_at" integer,
	"child_key_tags_json" jsonb,
	"user_email" text NOT NULL,
	"metadata_json" jsonb,
	"status_code" integer,
	"response_content_type" text,
	"duration_ms" integer,
	"first_token_ms" integer,
	"response_id" text,
	"input_token" integer DEFAULT 0,
	"output_token" integer DEFAULT 0,
	"cached_input_token" integer DEFAULT 0,
	"total_token" integer DEFAULT 0,
	"cost" double precision DEFAULT 0,
	"logged_at" timestamp NOT NULL,
	"log_date" date NOT NULL,
	"input_price" double precision,
	"output_price" double precision,
	"input_cache_price" double precision,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);


--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "llm_provider" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"api_url" text NOT NULL,
	"encrypted_api_key" text NOT NULL,
	"compatibility_type" "compatibility_type" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"creator_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"alias" text NOT NULL,
	"input_price" double precision NOT NULL,
	"output_price" double precision NOT NULL,
	"input_cache_price" double precision NOT NULL,
	"provider_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"created_at" timestamp NOT NULL,
	"metadata" text,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "request_log" (
	"event_id" text NOT NULL,
	"request_id" text NOT NULL,
	"request_payload_json" text,
	"response_text" text,
	"status_code" integer,
	"is_stream" boolean DEFAULT false NOT NULL,
	"gateway_path" text NOT NULL,
	"logged_at" timestamp NOT NULL,
	"log_date" date NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_key" ADD CONSTRAINT "child_key_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_key" ADD CONSTRAINT "child_key_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_log" ADD CONSTRAINT "event_log_provider_id_llm_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."llm_provider"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_log" ADD CONSTRAINT "event_log_child_key_id_child_key_id_fk" FOREIGN KEY ("child_key_id") REFERENCES "public"."child_key"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_log" ADD CONSTRAINT "event_log_child_key_creator_id_user_id_fk" FOREIGN KEY ("child_key_creator_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_log" ADD CONSTRAINT "event_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "llm_provider" ADD CONSTRAINT "llm_provider_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "llm_provider" ADD CONSTRAINT "llm_provider_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model" ADD CONSTRAINT "model_provider_id_llm_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."llm_provider"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model" ADD CONSTRAINT "model_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_log" ADD CONSTRAINT "request_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "child_key_tags_idx" ON "child_key" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "event_log_date_idx" ON "event_log" USING btree ("log_date");--> statement-breakpoint
CREATE INDEX "tags_path_gin_idx" ON "event_log" USING gin ("child_key_tags_json" jsonb_path_ops);--> statement-breakpoint
CREATE INDEX "metadata_path_gin_idx" ON "event_log" USING gin ("metadata_json" jsonb_path_ops);--> statement-breakpoint
CREATE INDEX "invitation_organizationId_idx" ON "invitation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "llm_provider_name_compatibility_type_key" ON "llm_provider" USING btree ("organization_id","name","compatibility_type");--> statement-breakpoint
CREATE INDEX "llm_provider_creator_id_idx" ON "llm_provider" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "llm_provider_organization_id_idx" ON "llm_provider" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "llm_provider_name_fts_idx" ON "llm_provider" USING gin (to_tsvector('simple'::regconfig, "name"));--> statement-breakpoint
CREATE INDEX "member_organizationId_idx" ON "member" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "member_userId_idx" ON "member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "model_provider_id_idx" ON "model" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "model_name_fts_idx" ON "model" USING gin (to_tsvector('simple'::regconfig, "name"));--> statement-breakpoint
CREATE INDEX "request_log_date_idx" ON "request_log" USING btree ("log_date");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");