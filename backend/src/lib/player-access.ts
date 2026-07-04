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

/** DM screen access for a player via an explicit DmScreenAccess share. */
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

/** Whether a DM screen is embedded in a portal view shared with this player. */
export const hasDmScreenInSharedPortal = async (
  userId: number,
  dmScreenId: string
): Promise<boolean> => {
  const portalShares = await prisma.portalViewAccess.findMany({
    where: { userId },
    include: { portalView: { select: { items: true } } },
  });

  return portalShares.some((share) => {
    const items = share.portalView.items;
    if (!Array.isArray(items)) return false;
    return (items as { type?: string; dmScreenId?: string }[]).some(
      (item) => item?.type === 'DmScreenViewer' && item?.dmScreenId === dmScreenId
    );
  });
};

/**
 * DM screen access for a PLAYER: explicit share, or view-only when the screen
 * is shown inside a portal they can open (same experience as the portal viewer).
 */
export const getPlayerDmScreenAccess = async (
  userId: number,
  dmScreenId: string
): Promise<{ canEdit: boolean } | null> => {
  const direct = await getDmScreenAccess(userId, dmScreenId);
  if (direct) return direct;

  if (await hasDmScreenInSharedPortal(userId, dmScreenId)) {
    return { canEdit: false };
  }

  return null;
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

const PORTAL_FILE_VIEWER_TYPES = new Set(['ImageViewer', 'VideoViewer', 'PDFViewer']);

/** Whether a file is shown inside a portal view shared with this player. */
export const hasFileInSharedPortal = async (
  userId: number,
  fileId: number
): Promise<boolean> => {
  const portalShares = await prisma.portalViewAccess.findMany({
    where: { userId },
    include: { portalView: { select: { items: true } } },
  });

  return portalShares.some((share) => {
    const items = share.portalView.items;
    if (!Array.isArray(items)) return false;
    return (items as { type?: string; object?: { id?: number } }[]).some((item) => {
      if (!item?.type || !PORTAL_FILE_VIEWER_TYPES.has(item.type)) return false;
      return item.object?.id === fileId;
    });
  });
};

/** Whether a file is attached to a library item shared with this player. */
export const hasFileOnSharedItem = async (
  userId: number,
  fileId: number
): Promise<boolean> => {
  const row = await prisma.itemAccess.findFirst({
    where: {
      userId,
      libraryItem: {
        OR: [
          { featuredImageId: fileId },
          { userFiles: { some: { id: fileId } } },
        ],
      },
    },
    select: { id: true },
  });
  return row !== null;
};

/**
 * Whether a PLAYER may fetch a file they do not own (portal viewer content
 * or attachments on shared library items).
 */
export const canPlayerAccessFile = async (
  userId: number,
  fileId: number
): Promise<boolean> => {
  if (await hasFileInSharedPortal(userId, fileId)) return true;
  if (await hasFileOnSharedItem(userId, fileId)) return true;
  return false;
};
