Write a script to create event log mock data and insert the data into the database.
The event log table is `request_log`.

The log date ranging from 2026-06-01 to 2026-08-01. Before insert the data into the request_log, ensure the partition is available, or not create the partition table first, then insert the data.

```sql
CREATE TABLE IF NOT EXISTS request_log_2026_08_01 PARTITION OF request_log
      FOR VALUES FROM ('2026-08-01') TO ('2026-08-02');
```

The schema of request_log is here: apps/gateway-ingest/src/db/schema.ts

Please refer to the comment to the field about how to generate the mock data. Generate the mock data first as a json file. and then a typescript script to insert the mock to the data, or your just write a single script to generate while inserting.

```ts
export const eventLog = pgTable(
  "event_log",
  {
    eventId: text().notNull(), // random uuid
    requestId: text().notNull(), // random uuid
    schemaVersion: integer().notNull(), //1
    eventType: text().notNull(), // "request"
    startedAt: timestamp().notNull(), // the random timestamp within log date
    completedAt: timestamp(), // startedAt + (1 - 5) seconds
    gatewayPath: text().notNull(), // /chat
    httpMethod: text().notNull(), // "POST"
    apiFamily: compatibilityTypeEnum().notNull(), // "openai" or "anthropic"
    providerId: text().references(() => llmProviders.id, {
      onDelete: "set null",
    }), //  null
    provider: text().notNull(), // openai, anthropic, openrouter, deepseek, minimax, moonshotai, google etc.
    requestedModel: text().notNull(), // minimax-m3, gpt-5.1, deepseek-v4-flash, minimax-m3, gemini-2.5 flash etc.
    requestedModelAlias: text().notNull(), // the combination provider/model
    upstreamModel: text().notNull(), // the model name of the upstream provider, minimax-m3, gpt-5.1, deepseek-v4-flash, minimax-m3, gemini-2.5 flash etc.
    upstreamUrl: text().notNull(), // the url of the upstream provider, e.g. https://api.openai.com/v1/chat/completions, https://api.deepseek.cn/v1/chat/completions, https://api.moonshotai.com/v1/chat/completions, https://api.google.com/v1/chat/completions etc.
    isStream: boolean().notNull().default(false), // true or false
    responseMode: text().notNull(), // "stream" or "non-stream"
    childKeyId: text().references(() => childKeys.id, {
      onDelete: "set null",
    }), //  null
    childKeyName: text().notNull(), // the random name of the child key, such as team-growth-prod
    childKeyCreatorId: text().references(() => user.id, {
      onDelete: "set null",
    }), // null
    childKeyIssuedAt: integer(), // the random timestamp within log date
    childKeyTagsJson: jsonb().$type<Record<string, string>>(), // the tags of the child key, such as {"team": "growth", "env": "prod"} etc
    userEmail: text().notNull(), // the random email of the user, such as user@example.com etc.
    metadataJson: jsonb().$type<Record<string, unknown>>(), // the metadata of the request, such as {"user_id": "123456"} etc
    statusCode: integer(), // 200
    responseContentType: text(), // "application/json"
    durationMs: integer(), // the duration of the request in milliseconds
    firstTokenMs: integer(), // the timestamp of the first token in milliseconds
    responseId: text(), // the random uuid
    inputToken: integer().default(0), // the number of input tokens ranging from 10 - 100000
    outputToken: integer().default(0), // the number of output tokens ranging from 10 - 100000
    cachedInputToken: integer().default(0), // the number of cached input tokens ranging from 0 - 1000
    totalToken: integer().default(0), // the total number of tokens ranging from 10 - 200000
    cost: doublePrecision().default(0), // the cost of the request in dollars, ranging from 0 - 10
    loggedAt: timestamp().notNull(), // the timestamp of the event log, completed at + (1 - 5) seconds
    logDate: date().notNull(), // the log date, ranging from 2026-06-01 to 2026-08-01
    inputPrice: doublePrecision(), // the ranging from 1-15
    outputPrice: doublePrecision(), // the ranging from 2 - 25
    inputCachePrice: doublePrecision(), // the ranging from 0 - 10
    ...timestamps, // same as the log date time
  },
  (table) => [
    // primaryKey({ columns: [table.eventId, table.logDate] }),
    index("event_log_date_idx").on(table.logDate),
    index("tags_path_gin_idx").using(
      "gin",
      sql`${table.childKeyTagsJson} jsonb_path_ops`,
    ),
    index("metadata_path_gin_idx").using(
      "gin",
      sql`${table.metadataJson} jsonb_path_ops`,
    ),
  ],
);
```
