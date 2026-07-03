import { ItemPermission } from '@prisma/client';
import { prisma } from './prisma';

/**
 * Fine-grained access checks for PLAYER-role members. Players hold a
 * LibraryAccess row (role PLAYER) but only see content explicitly shared
 * with them through ItemAccess / DmScreenAccess / PortalViewAccess.
 */

/** Permission a player holds on a specific library item, or null if unshared. */
export const getItemPermission = async (
  userId: number,
  libraryItemId: number
): Promise<ItemPermission | null> => {
  const access = await prisma.itemAccess.findUnique({
    where: { libraryItemId_userId: { libraryItemId, userId } },
    select: { permission: true },
  });
  return access?.permission ?? null;
};

/** DM screen access for a player, or null if unshared. */
export const getDmScreenAccess = async (
  userId: number,
  dmScreenId: string
): Promise<{ canEdit: boolean } | null> => {
  const access = await prisma.dmScreenAccess.findUnique({
    where: { dmScreenId_userId: { dmScreenId, userId } },
    select: { canEdit: true },
  });
  return access ?? null;
};

/** Whether a player can see a specific portal view. */
export const hasPortalAccess = async (
  userId: number,
  portalViewId: string
): Promise<boolean> => {
  const access = await prisma.portalViewAccess.findUnique({
    where: { portalViewId_userId: { portalViewId, userId } },
    select: { id: true },
  });
  return access !== null;
};

/** All item ids in a library the player can view (VIEW or EDIT). */
export const getViewableItemIds = async (
  userId: number,
  libraryId: number
): Promise<Set<number>> => {
  const rows = await prisma.itemAccess.findMany({
    where: { userId, libraryItem: { libraryId } },
    select: { libraryItemId: true },
  });
  return new Set(rows.map((r) => r.libraryItemId));
};
