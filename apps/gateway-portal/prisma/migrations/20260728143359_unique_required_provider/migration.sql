/*
  Warnings:

  - A unique constraint covering the columns `[name,compatibilityType]` on the table `LLMProvider` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "LLMProvider_name_compatibilityType_key" ON "LLMProvider"("name", "compatibilityType");
