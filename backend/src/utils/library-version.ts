import { prisma } from '../lib/prisma';
import { Prisma, PrismaClient } from '@prisma/client';

// Type for transaction client or regular prisma client
type PrismaTransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/**
 * Increment library version (for library metadata changes)
 * Supports being called within a transaction
 */
export async function incrementLibraryVersion(
  libraryId: number,
  tx?: PrismaTransactionClient
): Promise<void> {
  const client = tx ?? prisma;
  await client.libraryVersion.upsert({
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
 * Supports being called within a transaction
 */
export async function incrementTagsVersion(
  libraryId: number,
  tx?: PrismaTransactionClient
): Promise<void> {
  const client = tx ?? prisma;
  await client.libraryVersion.upsert({
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
 * Supports being called within a transaction
 */
export async function incrementItemsVersion(
  libraryId: number,
  tx?: PrismaTransactionClient
): Promise<void> {
  const client = tx ?? prisma;
  await client.libraryVersion.upsert({
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
