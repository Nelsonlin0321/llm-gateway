/*
  Warnings:

  - You are about to drop the column `inputCachePrice` on the `LLMProvider` table. All the data in the column will be lost.
  - You are about to drop the column `inputPrice` on the `LLMProvider` table. All the data in the column will be lost.
  - You are about to drop the column `outputPrice` on the `LLMProvider` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "LLMProvider" DROP COLUMN "inputCachePrice",
DROP COLUMN "inputPrice",
DROP COLUMN "outputPrice";
