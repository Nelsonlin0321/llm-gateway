/*
  Warnings:

  - Added the required column `creatorEmail` to the `ChildKey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userEmail` to the `ChildKey` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ChildKey" ADD COLUMN     "creatorEmail" TEXT NOT NULL,
ADD COLUMN     "userEmail" TEXT NOT NULL;
