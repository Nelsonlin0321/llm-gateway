-- DropIndex
DROP INDEX "LLMProvider_creatorId_isActive_idx";

-- DropIndex
DROP INDEX "LLMProvider_creatorId_name_idx";

-- CreateIndex
CREATE INDEX "LLMProvider_creatorId_idx" ON "LLMProvider"("creatorId");
