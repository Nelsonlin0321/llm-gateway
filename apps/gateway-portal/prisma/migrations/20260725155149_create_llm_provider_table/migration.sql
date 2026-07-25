-- CreateEnum
CREATE TYPE "CompatibilityType" AS ENUM ('openai', 'anthropic');

-- CreateTable
CREATE TABLE "LLMProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiUrl" TEXT NOT NULL,
    "encryptedApiKey" TEXT NOT NULL,
    "compatibilityType" "CompatibilityType" NOT NULL,
    "inputPrice" DOUBLE PRECISION,
    "inputCachePrice" DOUBLE PRECISION,
    "outputPrice" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LLMProvider_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LLMProvider" ADD CONSTRAINT "LLMProvider_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
