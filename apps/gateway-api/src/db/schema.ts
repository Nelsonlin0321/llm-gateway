import { relations } from "drizzle-orm";
import {
  boolean,
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

export const compatibilityTypeEnum = pgEnum("compatibility_type", [
  "openai",
  "anthropic",
]);

export const users = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("user_email_key").on(table.email)],
);

export const sessions = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("session_token_key").on(table.token),
    index("session_user_id_idx").on(table.userId),
  ],
);

export const accounts = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      mode: "date",
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      mode: "date",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verifications = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const llmProviders = pgTable(
  "llm_provider",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    apiUrl: text("api_url").notNull(),
    encryptedApiKey: text("encrypted_api_key").notNull(),
    compatibilityType: compatibilityTypeEnum("compatibility_type").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    creatorId: text("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
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
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    alias: text("alias").notNull(),
    inputPrice: doublePrecision("input_price").notNull(),
    outputPrice: doublePrecision("output_price").notNull(),
    inputCachePrice: doublePrecision("input_cache_price").notNull(),
    providerId: text("provider_id")
      .notNull()
      .references(() => llmProviders.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("model_provider_id_idx").on(table.providerId)],
);

export const childKeys = pgTable(
  "child_key",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    key: text("key").notNull(),
    creatorId: text("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userEmail: text("user_email").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    tags: jsonb("tags").$type<Record<string, string>>().notNull().default({}),
    expiresAt: timestamp("expires_at", { mode: "date" }),
    issuedAt: integer("issued_at").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Existing DB index uses GIN + jsonb_path_ops; declared for schema parity.
    index("child_key_tags_idx").using("gin", table.tags),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  llmProviders: many(llmProviders),
  childKeys: many(childKeys),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const llmProvidersRelations = relations(
  llmProviders,
  ({ one, many }) => ({
    creator: one(users, {
      fields: [llmProviders.creatorId],
      references: [users.id],
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
  creator: one(users, {
    fields: [childKeys.creatorId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Verification = typeof verifications.$inferSelect;
export type LLMProvider = typeof llmProviders.$inferSelect;
export type Model = typeof models.$inferSelect;
export type ChildKey = typeof childKeys.$inferSelect;
export type NewLLMProvider = typeof llmProviders.$inferInsert;
export type NewModel = typeof models.$inferInsert;
export type NewChildKey = typeof childKeys.$inferInsert;
