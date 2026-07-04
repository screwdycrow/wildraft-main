import { AccessRole, ItemPermission } from '@prisma/client';
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

const fileIdMatches = (value: unknown, fileId: number): boolean =>
  typeof value === 'number' && value === fileId;

/** Library ids where the user is a PLAYER member. */
const getPlayerLibraryIds = async (userId: number): Promise<number[]> => {
  const rows = await prisma.libraryAccess.findMany({
    where: { userId, role: AccessRole.PLAYER },
    select: { libraryId: true },
  });
  return rows.map((r) => r.libraryId);
};

/** File is in the library media pool, or linked to any item/tag in the library. */
const isFileInLibraryCatalog = async (
  fileId: number,
  libraryId: number
): Promise<boolean> => {
  const row = await prisma.userFile.findFirst({
    where: {
      id: fileId,
      OR: [
        { category: { libraryId } },
        { libraryItems: { some: { libraryId } } },
        { featuredInItems: { some: { libraryId } } },
        { featuredInTags: { some: { libraryId } } },
      ],
    },
    select: { id: true },
  });
  return row !== null;
};

/** File appears in any portal view item in the library. */
const isFileInLibraryPortals = async (
  fileId: number,
  libraryId: number
): Promise<boolean> => {
  const portals = await prisma.portalView.findMany({
    where: { libraryId },
    select: { items: true },
  });

  return portals.some((portal) => {
    if (!Array.isArray(portal.items)) return false;
    return (portal.items as { type?: string; object?: { id?: unknown } }[]).some(
      (item) =>
        !!item?.type &&
        PORTAL_FILE_VIEWER_TYPES.has(item.type) &&
        fileIdMatches(item.object?.id, fileId)
    );
  });
};

/** File is referenced on a DM screen in the library (settings or nodes). */
const isFileInLibraryDmScreens = async (
  fileId: number,
  libraryId: number
): Promise<boolean> => {
  const screens = await prisma.dMScreen.findMany({
    where: { libraryId },
    select: { items: true, settings: true },
  });

  return screens.some((screen) => {
    const settings = screen.settings as {
      backgroundImageId?: number;
      canvasBackgroundImageId?: number;
    } | null;
    if (
      settings?.backgroundImageId === fileId ||
      settings?.canvasBackgroundImageId === fileId
    ) {
      return true;
    }

    if (!Array.isArray(screen.items)) return false;
    return (screen.items as { type?: string; data?: { id?: unknown; userFileId?: unknown } }[]).some(
      (item) => {
        if (item?.type === 'UserFileId' && fileIdMatches(item.data?.id, fileId)) return true;
        if (item?.type === 'TokenNode' && fileIdMatches(item.data?.userFileId, fileId)) return true;
        return false;
      }
    );
  });
};

/** Whether a file is used anywhere in a library (media, items, portals, DM screens). */
export const isFileUsedInLibrary = async (
  fileId: number,
  libraryId: number
): Promise<boolean> => {
  if (await isFileInLibraryCatalog(fileId, libraryId)) return true;
  if (await isFileInLibraryPortals(fileId, libraryId)) return true;
  if (await isFileInLibraryDmScreens(fileId, libraryId)) return true;
  return false;
};

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
 * Whether a PLAYER may fetch a file they do not own.
 * Any player in a library can read files used anywhere in that library
 * (media pool, items, portals, DM screens) so portal/DM content always loads.
 */
export const canPlayerAccessFile = async (
  userId: number,
  fileId: number
): Promise<boolean> => {
  const libraryIds = await getPlayerLibraryIds(userId);
  for (const libraryId of libraryIds) {
    if (await isFileUsedInLibrary(fileId, libraryId)) return true;
  }
  return false;
};
