import { prisma } from '../lib/prisma';

/**
 * Increment library version (for library metadata changes)
 */
export async function incrementLibraryVersion(libraryId: number): Promise<void> {
  await prisma.libraryVersion.upsert({
    where: { libraryId },
    update: { version: { increment: 1 } },
    create: {
      libraryId,
      version: 1,
      tagsVersion: 1,
      itemsVersion: 1,
    },
  });
}

/**
 * Increment tags version (for tag changes)
 */
export async function incrementTagsVersion(libraryId: number): Promise<void> {
  await prisma.libraryVersion.upsert({
    where: { libraryId },
    update: { tagsVersion: { increment: 1 } },
    create: {
      libraryId,
      version: 1,
      tagsVersion: 1,
      itemsVersion: 1,
    },
  });
}

/**
 * Increment items version (for library item changes)
 */
export async function incrementItemsVersion(libraryId: number): Promise<void> {
  await prisma.libraryVersion.upsert({
    where: { libraryId },
    update: { itemsVersion: { increment: 1 } },
    create: {
      libraryId,
      version: 1,
      tagsVersion: 1,
      itemsVersion: 1,
    },
  });
}

