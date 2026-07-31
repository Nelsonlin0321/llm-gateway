import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Column names are derived from camelCase keys via drizzle `casing: "snake_case"`
 * (see drizzle.config.ts and lib/db/index.ts). Do not hardcode snake_case aliases.
 */

const timestamps = {
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
};

export const user = pgTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().default(false).notNull(),
  image: text(),
  ...timestamps,
});

export const session = pgTable(
  "session",
  {
    id: text().primaryKey(),
    expiresAt: timestamp().notNull(),
    token: text().notNull().unique(),
    ipAddress: text(),
    userAgent: text(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text().primaryKey(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp(),
    refreshTokenExpiresAt: timestamp(),
    scope: text(),
    password: text(),
    ...timestamps,
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp().notNull(),
    ...timestamps,
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const compatibilityTypeEnum = pgEnum("compatibility_type", [
  "openai",
  "anthropic",
]);

export const llmProviders = pgTable(
  "llm_provider",
  {
    id: text().primaryKey(),
    name: text().notNull(),
    apiUrl: text().notNull(),
    encryptedApiKey: text().notNull(),
    compatibilityType: compatibilityTypeEnum().notNull(),
    isActive: boolean().notNull().default(true),
    creatorId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("llm_provider_name_compatibility_type_key").on(
      table.name,
      table.compatibilityType,
    ),
    index("llm_provider_creator_id_idx").on(table.creatorId),
  ],
);

export const models = pgTable(
  "model",
  {
    id: text().primaryKey(),
    name: text().notNull(),
    alias: text().notNull(),
    inputPrice: doublePrecision().notNull(),
    outputPrice: doublePrecision().notNull(),
    inputCachePrice: doublePrecision().notNull(),
    providerId: text()
      .notNull()
      .references(() => llmProviders.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [index("model_provider_id_idx").on(table.providerId)],
);

export const childKeys = pgTable(
  "child_key",
  {
    id: text().primaryKey(),
    name: text().notNull(),
    key: text().notNull(),
    creatorId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    userEmail: text().notNull(),
    isActive: boolean().notNull().default(true),
    tags: jsonb().$type<Record<string, string>>().notNull().default({}),
    expiresAt: timestamp({ mode: "date" }),
    issuedAt: integer().notNull(),
    ...timestamps,
  },
  (table) => [
    // Existing DB index uses GIN + jsonb_path_ops; declared for schema parity.
    index("child_key_tags_idx").using("gin", table.tags),
  ],
);

/**
 * Request/response header + payload capture for gateway calls.
 * Primary key `id` is the gateway `request_id`.
 *
 * Intended PostgreSQL layout (custom SQL migration; Drizzle does not model this):
 *   PARTITION BY RANGE (log_date)
 */
export const requestLogs = pgTable(
  "request_log",
  {
    id: text().primaryKey(),
    requestHeadersJson: jsonb().$type<Record<string, unknown>>(),
    requestPayloadJson: jsonb().$type<unknown>(),
    responseHeadersJson: jsonb().$type<Record<string, unknown>>(),
    responsePayloadJson: jsonb().$type<unknown>(),
    loggedAt: timestamp({ mode: "date" }).notNull(),
    logDate: date().notNull(),
    ...timestamps,
  },
  (table) => [
    index("logged_at_idx").on(table.loggedAt),
    index("created_at_idx").on(table.createdAt),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const llmProvidersRelations = relations(
  llmProviders,
  ({ one, many }) => ({
    creator: one(user, {
      fields: [llmProviders.creatorId],
      references: [user.id],
    }),
    models: many(models),
  }),
);

export const modelsRelations = relations(models, ({ one }) => ({
  provider: one(llmProviders, {
    fields: [models.providerId],
    references: [llmProviders.id],
  }),
}));

export const childKeysRelations = relations(childKeys, ({ one }) => ({
  creator: one(user, {
    fields: [childKeys.creatorId],
    references: [user.id],
  }),
}));

export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;
export type LLMProvider = typeof llmProviders.$inferSelect;
export type Model = typeof models.$inferSelect;
export type ChildKey = typeof childKeys.$inferSelect;
export type RequestLog = typeof requestLogs.$inferSelect;
export type NewLLMProvider = typeof llmProviders.$inferInsert;
export type NewModel = typeof models.$inferInsert;
export type NewChildKey = typeof childKeys.$inferInsert;
export type NewRequestLog = typeof requestLogs.$inferInsert;
