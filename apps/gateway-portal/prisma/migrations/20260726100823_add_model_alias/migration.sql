/*
  Warnings:

  - Added the required column `alias` to the `Model` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Model" ADD COLUMN     "alias" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Model_providerId_idx" ON "Model"("providerId");
