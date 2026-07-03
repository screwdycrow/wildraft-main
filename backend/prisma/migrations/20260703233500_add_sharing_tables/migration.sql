-- Player sharing tables: invite links, per-item access, per-DM-screen access,
-- per-portal access.

-- CreateTable
CREATE TABLE "PlayerInvitation" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "libraryId" INTEGER NOT NULL,
    "role" "AccessRole" NOT NULL DEFAULT 'PLAYER',
    "email" TEXT,
    "createdById" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "maxUses" INTEGER,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "revokedAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "usedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemAccess" (
    "id" SERIAL NOT NULL,
    "libraryItemId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "permission" "ItemPermission" NOT NULL DEFAULT 'VIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DmScreenAccess" (
    "id" SERIAL NOT NULL,
    "dmScreenId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "canEdit" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DmScreenAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalViewAccess" (
    "id" SERIAL NOT NULL,
    "portalViewId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortalViewAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerInvitation_token_key" ON "PlayerInvitation"("token");

-- CreateIndex
CREATE INDEX "PlayerInvitation_libraryId_idx" ON "PlayerInvitation"("libraryId");

-- CreateIndex
CREATE INDEX "ItemAccess_userId_idx" ON "ItemAccess"("userId");

-- CreateIndex
CREATE INDEX "ItemAccess_libraryItemId_idx" ON "ItemAccess"("libraryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemAccess_libraryItemId_userId_key" ON "ItemAccess"("libraryItemId", "userId");

-- CreateIndex
CREATE INDEX "DmScreenAccess_userId_idx" ON "DmScreenAccess"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DmScreenAccess_dmScreenId_userId_key" ON "DmScreenAccess"("dmScreenId", "userId");

-- CreateIndex
CREATE INDEX "PortalViewAccess_userId_idx" ON "PortalViewAccess"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PortalViewAccess_portalViewId_userId_key" ON "PortalViewAccess"("portalViewId", "userId");

-- AddForeignKey
ALTER TABLE "PlayerInvitation" ADD CONSTRAINT "PlayerInvitation_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemAccess" ADD CONSTRAINT "ItemAccess_libraryItemId_fkey" FOREIGN KEY ("libraryItemId") REFERENCES "LibraryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemAccess" ADD CONSTRAINT "ItemAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmScreenAccess" ADD CONSTRAINT "DmScreenAccess_dmScreenId_fkey" FOREIGN KEY ("dmScreenId") REFERENCES "DMScreen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DmScreenAccess" ADD CONSTRAINT "DmScreenAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalViewAccess" ADD CONSTRAINT "PortalViewAccess_portalViewId_fkey" FOREIGN KEY ("portalViewId") REFERENCES "PortalView"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalViewAccess" ADD CONSTRAINT "PortalViewAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
