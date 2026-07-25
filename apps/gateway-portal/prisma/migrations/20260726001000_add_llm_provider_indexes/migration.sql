CREATE INDEX "LLMProvider_creatorId_isActive_idx"
ON "LLMProvider" ("creatorId", "isActive");

CREATE INDEX "LLMProvider_creatorId_name_idx"
ON "LLMProvider" ("creatorId", "name");

CREATE UNIQUE INDEX "LLMProvider_creatorId_name_active_unique"
ON "LLMProvider" ("creatorId", "name")
WHERE "isActive" = true;
