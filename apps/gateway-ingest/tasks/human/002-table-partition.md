request_log and event_log are partition by log_date, which improve the analytics performance by aggregated by the date. Please refer to the sql of table request_log and event_log.

```sql
CREATE TABLE "request_log" (
	"event_id" text NOT NULL,
	"request_id" text NOT NULL,
	"request_headers_json" jsonb,
	"request_payload_json" jsonb,
	"response_headers_json" jsonb,
	"response_payload_json" jsonb,
	"status_code" integer,
	"is_stream" boolean DEFAULT false NOT NULL,
	"gateway_path" text NOT NULL,
	"logged_at" timestamp NOT NULL,
	"log_date" date NOT NULL
) PARTITION BY RANGE (log_date);
```

```sql
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
	"response_id" text,
	"input_token" integer DEFAULT 0,
	"output_token" integer DEFAULT 0,
	"cached_input_token" integer DEFAULT 0,
	"cost" double precision DEFAULT 0,
	"logged_at" timestamp NOT NULL,
	"log_date" date NOT NULL,
	"created_at" timestamp DEFAULT NOW() NOT NULL,
	"updated_at" timestamp NOT NULL
) PARTITION BY RANGE (log_date);
```

Normal value insert to the table will cause the exception

```error
error: no partition of relation "request_log" found for row
     length: 212,
   severity: "ERROR",
     detail: "Partition key of the failing row contains (log_date) = (2026-08-01).",
       hint: undefined,
   position: undefined,
 internalPosition: undefined,
 internalQuery: undefined,
      where: undefined,
     schema: "public",
      table: "request_log",
   dataType: undefined,
 constraint: undefined,
       file: "execPartition.c",
    routine: "ExecFindPartition",
       code: "23514"
```

Update the value insert logic that, try to insert the value in to the table first. If it throw this error, we create the partition first, and then insert the value again.

Example

```sql
CREATE TABLE request_log_2026_08_01 PARTITION OF request_log
    FOR VALUES FROM ('2026-08-01') TO ('2026-08-02');
```
