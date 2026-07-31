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

export const compatibilityTypeEnum = pgEnum("CompatibilityType", [
  "openai",
  "anthropic",
]);

export const users = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("emailVerified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
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
    expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("session_token_key").on(table.token),
    index("session_userId_idx").on(table.userId),
  ],
);

export const accounts = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt", { mode: "date" }),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", {
      mode: "date",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verifications = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const llmProviders = pgTable(
  "LLMProvider",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    apiUrl: text("apiUrl").notNull(),
    encryptedApiKey: text("encryptedApiKey").notNull(),
    compatibilityType: compatibilityTypeEnum("compatibilityType").notNull(),
    isActive: boolean("isActive").notNull().default(true),
    creatorId: text("creatorId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("LLMProvider_name_compatibilityType_key").on(
      table.name,
      table.compatibilityType,
    ),
    index("LLMProvider_creatorId_idx").on(table.creatorId),
  ],
);

export const models = pgTable(
  "Model",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    alias: text("alias").notNull(),
    inputPrice: doublePrecision("inputPrice").notNull(),
    outputPrice: doublePrecision("outputPrice").notNull(),
    inputCachePrice: doublePrecision("inputCachePrice").notNull(),
    providerId: text("providerId")
      .notNull()
      .references(() => llmProviders.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("Model_providerId_idx").on(table.providerId)],
);

export const childKeys = pgTable(
  "ChildKey",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    key: text("key").notNull(),
    creatorId: text("creatorId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userEmail: text("userEmail").notNull(),
    isActive: boolean("isActive").notNull().default(true),
    tags: jsonb("tags").$type<Record<string, string>>().notNull().default({}),
    expiresAt: timestamp("expiresAt", { mode: "date" }),
    issuedAt: integer("issuedAt").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Existing DB index uses GIN + jsonb_path_ops; declared for schema parity.
    index("ChildKey_tags_idx").using("gin", table.tags),
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
