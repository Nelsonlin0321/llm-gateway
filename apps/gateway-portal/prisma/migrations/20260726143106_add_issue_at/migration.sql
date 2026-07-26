/*
  Warnings:

  - Added the required column `issuedAt` to the `ChildKey` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ChildKey" ADD COLUMN     "issuedAt" INTEGER NOT NULL;
