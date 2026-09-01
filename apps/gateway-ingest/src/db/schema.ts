import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
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
    activeOrganizationId: text(),
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

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  createdAt: timestamp("created_at").notNull(),
  metadata: text("metadata"),
});

export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").default("member").notNull(),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("member_organizationId_userId_key").on(
      table.organizationId,
      table.userId,
    ),
    index("member_organizationId_idx").on(table.organizationId),
    index("member_userId_idx").on(table.userId),
  ],
);

export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("invitation_organizationId_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: text().primaryKey(),
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    actorUserId: text().references(() => user.id, { onDelete: "set null" }),
    actorEmail: text().notNull(),
    action: text().notNull(),
    entity: text().notNull(),
    entityId: text(),
    metadata: jsonb().$type<Record<string, unknown>>(),
    createdAt: timestamp().defaultNow().notNull(),
  },
  (table) => [
    index("audit_log_organization_id_idx").on(table.organizationId),
    index("audit_log_created_at_idx").on(table.createdAt),
  ],
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
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("llm_provider_name_compatibility_type_key").on(
      table.organizationId,
      table.name,
      table.compatibilityType,
    ),
    index("llm_provider_creator_id_idx").on(table.creatorId),
    index("llm_provider_organization_id_idx").on(table.organizationId),
    index("llm_provider_name_fts_idx").using(
      "gin",
      sql`to_tsvector('simple'::regconfig, ${table.name})`,
    ),
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
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("model_organization_id_alias_key").on(
      table.organizationId,
      table.alias,
    ),
    index("model_provider_id_idx").on(table.providerId),
    index("model_name_fts_idx").using(
      "gin",
      sql`to_tsvector('simple'::regconfig, ${table.name})`,
    ),
  ],
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
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    expiresAt: timestamp({ mode: "date" }),
    issuedAt: integer().notNull(),
    /** Requests per minute. Null uses the gateway default. 0 disables the cap. */
    rateLimitRpm: integer(),
    /** Optional monthly spend cap in USD. Null means unlimited. */
    monthlyBudgetUsd: doublePrecision(),
    ...timestamps,
  },
  (table) => [
    // Existing DB index uses GIN + jsonb_path_ops; declared for schema parity.
    index("child_key_tags_idx").using("gin", table.tags),
    index("child_key_organization_id_idx").on(table.organizationId),
  ],
);

/**
 * Request/response header + payload capture for gateway calls.
 * Primary key `id` is the gateway `request_id`.
 *
 * Intended PostgreSQL layout (custom SQL migration; Drizzle does not model this):
 *   PARTITION BY RANGE (log_date)
 */
export const requestLog = pgTable(
  "request_log",
  {
    eventId: text().notNull(),
    requestId: text().notNull(),
    // requestHeadersJson: text(),
    requestPayloadJson: text(),
    // responseHeadersJson: text(),
    responseText: text(),
    statusCode: integer(),
    isStream: boolean().notNull().default(false),
    gatewayPath: text().notNull(),
    loggedAt: timestamp().notNull(),
    logDate: date().notNull(),
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    index("request_log_date_idx").on(table.logDate),
    primaryKey({
      columns: [table.organizationId, table.eventId, table.logDate],
    }),
  ],
);

export const eventLog = pgTable(
  "event_log",
  {
    eventId: text().notNull(),
    requestId: text().notNull(),
    schemaVersion: integer().notNull(),
    eventType: text().notNull(),
    startedAt: timestamp().notNull(),
    completedAt: timestamp(),
    gatewayPath: text().notNull(),
    httpMethod: text().notNull(),
    apiFamily: compatibilityTypeEnum().notNull(),
    providerId: text().references(() => llmProviders.id, {
      onDelete: "set null",
    }),
    provider: text().notNull(),
    requestedModel: text().notNull(),
    requestedModelAlias: text().notNull(),
    upstreamModel: text().notNull(),
    upstreamUrl: text().notNull(),
    isStream: boolean().notNull().default(false),
    responseMode: text().notNull(),
    childKeyId: text().references(() => childKeys.id, {
      onDelete: "set null",
    }),
    childKeyName: text().notNull(),
    childKeyCreatorId: text().references(() => user.id, {
      onDelete: "set null",
    }),
    childKeyIssuedAt: integer(),
    childKeyTagsJson: jsonb().$type<Record<string, string>>(),
    userEmail: text().notNull(),
    metadataJson: jsonb().$type<Record<string, unknown>>(),
    statusCode: integer(),
    responseContentType: text(),
    durationMs: integer(),
    firstTokenMs: integer(),
    responseId: text(),
    inputToken: integer().default(0),
    outputToken: integer().default(0),
    cachedInputToken: integer().default(0),
    totalToken: integer().default(0),
    cost: doublePrecision().default(0),
    loggedAt: timestamp().notNull(),
    logDate: date().notNull(),
    inputPrice: doublePrecision(),
    outputPrice: doublePrecision(),
    inputCachePrice: doublePrecision(),
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    primaryKey({
      columns: [table.organizationId, table.logDate, table.eventId],
    }),
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

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  members: many(member),
  invitations: many(invitation),
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

export const eventLogRelations = relations(eventLog, ({ one }) => ({
  // Named llmProvider to avoid clashing with the denormalized `provider` text column.
  llmProvider: one(llmProviders, {
    fields: [eventLog.providerId],
    references: [llmProviders.id],
  }),
  childKey: one(childKeys, {
    fields: [eventLog.childKeyId],
    references: [childKeys.id],
  }),
  childKeyCreator: one(user, {
    fields: [eventLog.childKeyCreatorId],
    references: [user.id],
  }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [invitation.inviterId],
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
export type RequestLog = typeof requestLog.$inferSelect;
export type EventLog = typeof eventLog.$inferSelect;
export type Organization = typeof organization.$inferSelect;
export type Member = typeof member.$inferSelect;
export type Invitation = typeof invitation.$inferSelect;
export type NewLLMProvider = typeof llmProviders.$inferInsert;
export type NewModel = typeof models.$inferInsert;
export type NewChildKey = typeof childKeys.$inferInsert;
export type NewRequestLog = typeof requestLog.$inferInsert;
export type NewEventLog = typeof eventLog.$inferInsert;
export type NewOrganization = typeof organization.$inferInsert;
export type NewMember = typeof member.$inferInsert;
export type NewInvitation = typeof invitation.$inferInsert;
