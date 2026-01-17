/*
  Warnings:

  - You are about to drop the column `userId` on the `Library` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AccessRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- DropForeignKey
ALTER TABLE "public"."Library" DROP CONSTRAINT "Library_userId_fkey";

-- AlterTable
ALTER TABLE "Library" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT;

-- CreateTable
CREATE TABLE "LibraryAccess" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "libraryId" INTEGER NOT NULL,
    "role" "AccessRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LibraryAccess_userId_idx" ON "LibraryAccess"("userId");

-- CreateIndex
CREATE INDEX "LibraryAccess_libraryId_idx" ON "LibraryAccess"("libraryId");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryAccess_userId_libraryId_key" ON "LibraryAccess"("userId", "libraryId");

-- AddForeignKey
ALTER TABLE "LibraryAccess" ADD CONSTRAINT "LibraryAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryAccess" ADD CONSTRAINT "LibraryAccess_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;
