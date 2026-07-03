-- Reconciles schema drift accumulated via `prisma db push` after migration
-- 20251030193941_items. Generated with `prisma migrate diff --from-migrations
-- --to-schema-datamodel`. Already applied to existing databases via
-- `prisma migrate resolve --applied`; runs for real only on fresh databases.

-- AlterTable
ALTER TABLE "CombatEncounter" ADD COLUMN     "counters" JSONB,
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "DMScreen" DROP COLUMN "content",
ADD COLUMN     "items" JSONB,
ADD COLUMN     "settings" JSONB;

-- AlterTable
ALTER TABLE "Library" ADD COLUMN     "frontPageDmScreenId" TEXT;

-- AlterTable
ALTER TABLE "LibraryItem" ADD COLUMN     "color" TEXT NOT NULL DEFAULT '#6B7280',
ADD COLUMN     "featuredImageId" INTEGER;

-- AlterTable
ALTER TABLE "PortalView" DROP COLUMN "gridColor",
DROP COLUMN "gridOpacity",
DROP COLUMN "gridSize",
DROP COLUMN "gridType",
DROP COLUMN "gridUnit",
DROP COLUMN "gridUnitColor",
DROP COLUMN "gridUnitOpacity",
DROP COLUMN "gridUnitSize",
DROP COLUMN "lockZoom",
DROP COLUMN "showDetails",
DROP COLUMN "showgrid",
ADD COLUMN     "autoResetImageState" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showAC" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showActions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showHealth" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Tag" ADD COLUMN     "featuredImageId" INTEGER,
ADD COLUMN     "folderId" INTEGER,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "aiSettings" JSONB,
ADD COLUMN     "openaiApiKey" TEXT;

-- AlterTable
ALTER TABLE "UserFile" ADD COLUMN     "categoryId" INTEGER;

-- DropEnum
DROP TYPE "public"."GridType";

-- DropEnum
DROP TYPE "public"."GridUnit";

-- CreateTable
CREATE TABLE "TagFolder" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "libraryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TagFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFileCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "libraryId" INTEGER NOT NULL,

    CONSTRAINT "UserFileCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryVersion" (
    "id" SERIAL NOT NULL,
    "libraryId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "tagsVersion" INTEGER NOT NULL DEFAULT 1,
    "itemsVersion" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiConversation" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "userId" INTEGER NOT NULL,
    "libraryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiMessage" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contextItems" JSONB,
    "conversationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TagFolder_libraryId_idx" ON "TagFolder"("libraryId");

-- CreateIndex
CREATE UNIQUE INDEX "TagFolder_libraryId_name_key" ON "TagFolder"("libraryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryVersion_libraryId_key" ON "LibraryVersion"("libraryId");

-- CreateIndex
CREATE INDEX "LibraryVersion_libraryId_idx" ON "LibraryVersion"("libraryId");

-- CreateIndex
CREATE INDEX "AiConversation_userId_idx" ON "AiConversation"("userId");

-- CreateIndex
CREATE INDEX "AiConversation_libraryId_idx" ON "AiConversation"("libraryId");

-- CreateIndex
CREATE INDEX "AiMessage_conversationId_idx" ON "AiMessage"("conversationId");

-- CreateIndex
CREATE INDEX "LibraryItem_featuredImageId_idx" ON "LibraryItem"("featuredImageId");

-- CreateIndex
CREATE INDEX "Tag_folderId_idx" ON "Tag"("folderId");

-- CreateIndex
CREATE INDEX "Tag_featuredImageId_idx" ON "Tag"("featuredImageId");

-- AddForeignKey
ALTER TABLE "LibraryItem" ADD CONSTRAINT "LibraryItem_featuredImageId_fkey" FOREIGN KEY ("featuredImageId") REFERENCES "UserFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFile" ADD CONSTRAINT "UserFile_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "UserFileCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "TagFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_featuredImageId_fkey" FOREIGN KEY ("featuredImageId") REFERENCES "UserFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagFolder" ADD CONSTRAINT "TagFolder_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFileCategory" ADD CONSTRAINT "UserFileCategory_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryVersion" ADD CONSTRAINT "LibraryVersion_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiConversation" ADD CONSTRAINT "AiConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiConversation" ADD CONSTRAINT "AiConversation_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMessage" ADD CONSTRAINT "AiMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AiConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
