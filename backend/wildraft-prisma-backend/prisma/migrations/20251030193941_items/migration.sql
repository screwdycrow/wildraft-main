-- CreateEnum
CREATE TYPE "GridType" AS ENUM ('GRID');

-- CreateEnum
CREATE TYPE "GridUnit" AS ENUM ('FEET', 'METERS', 'INCHES');

-- CreateTable
CREATE TABLE "CombatEncounter" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "libraryId" INTEGER NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 1,
    "initativeCount" INTEGER NOT NULL DEFAULT 0,
    "combatants" JSONB,

    CONSTRAINT "CombatEncounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DMScreen" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "libraryId" INTEGER NOT NULL,
    "content" JSONB,

    CONSTRAINT "DMScreen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalView" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "libraryId" INTEGER NOT NULL,
    "showEncounter" BOOLEAN NOT NULL DEFAULT false,
    "showDetails" BOOLEAN NOT NULL DEFAULT false,
    "combatEncounterId" INTEGER,
    "showgrid" BOOLEAN NOT NULL DEFAULT false,
    "gridSize" INTEGER NOT NULL DEFAULT 10,
    "gridColor" TEXT NOT NULL DEFAULT '#000000',
    "gridOpacity" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "gridType" "GridType" NOT NULL DEFAULT 'GRID',
    "gridUnit" "GridUnit" NOT NULL DEFAULT 'FEET',
    "gridUnitSize" INTEGER NOT NULL DEFAULT 10,
    "gridUnitColor" TEXT NOT NULL DEFAULT '#000000',
    "gridUnitOpacity" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "lockZoom" BOOLEAN NOT NULL DEFAULT false,
    "currentItem" INTEGER,
    "items" JSONB,

    CONSTRAINT "PortalView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_LibraryItemFiles" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_LibraryItemFiles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "CombatEncounter_libraryId_idx" ON "CombatEncounter"("libraryId");

-- CreateIndex
CREATE INDEX "DMScreen_libraryId_idx" ON "DMScreen"("libraryId");

-- CreateIndex
CREATE INDEX "PortalView_libraryId_idx" ON "PortalView"("libraryId");

-- CreateIndex
CREATE INDEX "_LibraryItemFiles_B_index" ON "_LibraryItemFiles"("B");

-- AddForeignKey
ALTER TABLE "CombatEncounter" ADD CONSTRAINT "CombatEncounter_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DMScreen" ADD CONSTRAINT "DMScreen_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalView" ADD CONSTRAINT "PortalView_combatEncounterId_fkey" FOREIGN KEY ("combatEncounterId") REFERENCES "CombatEncounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalView" ADD CONSTRAINT "PortalView_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LibraryItemFiles" ADD CONSTRAINT "_LibraryItemFiles_A_fkey" FOREIGN KEY ("A") REFERENCES "LibraryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LibraryItemFiles" ADD CONSTRAINT "_LibraryItemFiles_B_fkey" FOREIGN KEY ("B") REFERENCES "UserFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
