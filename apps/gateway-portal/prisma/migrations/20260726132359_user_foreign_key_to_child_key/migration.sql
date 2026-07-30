/*
  Warnings:

  - You are about to drop the column `creatorEmail` on the `ChildKey` table. All the data in the column will be lost.
  - Added the required column `creatorId` to the `ChildKey` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ChildKey" DROP COLUMN "creatorEmail",
ADD COLUMN     "creatorId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "ChildKey" ADD CONSTRAINT "ChildKey_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
