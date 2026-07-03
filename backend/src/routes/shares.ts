import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireEditorAccess } from '../middleware/library-access';
import { ItemPermission } from '@prisma/client';
import {
  getItemSharesSchema,
  putItemSharesSchema,
  getDmScreenSharesSchema,
  putDmScreenSharesSchema,
  getPortalSharesSchema,
  putPortalSharesSchema,
  getPlayerSharesSchema,
} from '../schemas/shares.schemas';

const userSelect = { id: true, email: true, name: true, picture: true } as const;

/**
 * Validates that every userId in a share list is a member of the library.
 * Returns the invalid ids (empty array = all valid).
 */
const findNonMembers = async (libraryId: number, userIds: number[]): Promise<number[]> => {
  if (userIds.length === 0) return [];
  const members = await prisma.libraryAccess.findMany({
    where: { libraryId, userId: { in: userIds } },
    select: { userId: true },
  });
  const memberIds = new Set(members.map((m) => m.userId));
  return userIds.filter((id) => !memberIds.has(id));
};

/**
 * Share management for items / DM screens / portal views.
 * Registered under the /api/libraries prefix; all routes require EDITOR.
 */
export const shareRoutes = async (fastify: FastifyInstance) => {
  // ---------- Item shares ----------

  fastify.get<{ Params: { libraryId: string; itemId: string } }>(
    '/:libraryId/items/:itemId/shares',
    { schema: getItemSharesSchema, preHandler: [authenticateToken, requireEditorAccess] },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const itemId = parseInt(request.params.itemId, 10);

        const item = await prisma.libraryItem.findFirst({ where: { id: itemId, libraryId } });
        if (!item) {
          reply.code(404);
          return { error: 'Item not found' };
        }

        const shares = await prisma.itemAccess.findMany({
          where: { libraryItemId: itemId },
          include: { user: { select: userSelect } },
          orderBy: { createdAt: 'asc' },
        });

        return {
          shares: shares.map((s) => ({ userId: s.userId, user: s.user, permission: s.permission })),
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to fetch item shares');
        reply.code(500);
        return { error: 'Failed to fetch item shares' };
      }
    }
  );

  fastify.put<{
    Params: { libraryId: string; itemId: string };
    Body: { shares: { userId: number; permission?: ItemPermission }[] };
  }>(
    '/:libraryId/items/:itemId/shares',
    { schema: putItemSharesSchema, preHandler: [authenticateToken, requireEditorAccess] },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const itemId = parseInt(request.params.itemId, 10);
        const { shares } = request.body;

        const item = await prisma.libraryItem.findFirst({ where: { id: itemId, libraryId } });
        if (!item) {
          reply.code(404);
          return { error: 'Item not found' };
        }

        const nonMembers = await findNonMembers(libraryId, shares.map((s) => s.userId));
        if (nonMembers.length > 0) {
          reply.code(400);
          return {
            error: 'Invalid share list',
            message: `Users are not members of this library: ${nonMembers.join(', ')}`,
          };
        }

        await prisma.$transaction([
          prisma.itemAccess.deleteMany({ where: { libraryItemId: itemId } }),
          prisma.itemAccess.createMany({
            data: shares.map((s) => ({
              libraryItemId: itemId,
              userId: s.userId,
              permission: s.permission ?? ItemPermission.VIEW,
            })),
          }),
        ]);

        return { message: 'Shares updated' };
      } catch (error) {
        request.log.error({ error }, 'Failed to update item shares');
        reply.code(500);
        return { error: 'Failed to update item shares' };
      }
    }
  );

  // ---------- DM screen shares ----------

  fastify.get<{ Params: { libraryId: string; dmScreenId: string } }>(
    '/:libraryId/dm-screens/:dmScreenId/shares',
    { schema: getDmScreenSharesSchema, preHandler: [authenticateToken, requireEditorAccess] },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const { dmScreenId } = request.params;

        const dmScreen = await prisma.dMScreen.findFirst({ where: { id: dmScreenId, libraryId } });
        if (!dmScreen) {
          reply.code(404);
          return { error: 'DM screen not found' };
        }

        const shares = await prisma.dmScreenAccess.findMany({
          where: { dmScreenId },
          include: { user: { select: userSelect } },
          orderBy: { createdAt: 'asc' },
        });

        return {
          shares: shares.map((s) => ({ userId: s.userId, user: s.user, canEdit: s.canEdit })),
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to fetch DM screen shares');
        reply.code(500);
        return { error: 'Failed to fetch DM screen shares' };
      }
    }
  );

  fastify.put<{
    Params: { libraryId: string; dmScreenId: string };
    Body: { shares: { userId: number; canEdit?: boolean }[] };
  }>(
    '/:libraryId/dm-screens/:dmScreenId/shares',
    { schema: putDmScreenSharesSchema, preHandler: [authenticateToken, requireEditorAccess] },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const { dmScreenId } = request.params;
        const { shares } = request.body;

        const dmScreen = await prisma.dMScreen.findFirst({ where: { id: dmScreenId, libraryId } });
        if (!dmScreen) {
          reply.code(404);
          return { error: 'DM screen not found' };
        }

        const nonMembers = await findNonMembers(libraryId, shares.map((s) => s.userId));
        if (nonMembers.length > 0) {
          reply.code(400);
          return {
            error: 'Invalid share list',
            message: `Users are not members of this library: ${nonMembers.join(', ')}`,
          };
        }

        await prisma.$transaction([
          prisma.dmScreenAccess.deleteMany({ where: { dmScreenId } }),
          prisma.dmScreenAccess.createMany({
            data: shares.map((s) => ({
              dmScreenId,
              userId: s.userId,
              canEdit: s.canEdit ?? true,
            })),
          }),
        ]);

        return { message: 'Shares updated' };
      } catch (error) {
        request.log.error({ error }, 'Failed to update DM screen shares');
        reply.code(500);
        return { error: 'Failed to update DM screen shares' };
      }
    }
  );

  // ---------- Portal view shares ----------

  fastify.get<{ Params: { libraryId: string; portalViewId: string } }>(
    '/:libraryId/portal-views/:portalViewId/shares',
    { schema: getPortalSharesSchema, preHandler: [authenticateToken, requireEditorAccess] },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const { portalViewId } = request.params;

        const portalView = await prisma.portalView.findFirst({ where: { id: portalViewId, libraryId } });
        if (!portalView) {
          reply.code(404);
          return { error: 'Portal view not found' };
        }

        const shares = await prisma.portalViewAccess.findMany({
          where: { portalViewId },
          include: { user: { select: userSelect } },
          orderBy: { createdAt: 'asc' },
        });

        return { shares: shares.map((s) => ({ userId: s.userId, user: s.user })) };
      } catch (error) {
        request.log.error({ error }, 'Failed to fetch portal shares');
        reply.code(500);
        return { error: 'Failed to fetch portal shares' };
      }
    }
  );

  fastify.put<{
    Params: { libraryId: string; portalViewId: string };
    Body: { shares: { userId: number }[] };
  }>(
    '/:libraryId/portal-views/:portalViewId/shares',
    { schema: putPortalSharesSchema, preHandler: [authenticateToken, requireEditorAccess] },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const { portalViewId } = request.params;
        const { shares } = request.body;

        const portalView = await prisma.portalView.findFirst({ where: { id: portalViewId, libraryId } });
        if (!portalView) {
          reply.code(404);
          return { error: 'Portal view not found' };
        }

        const nonMembers = await findNonMembers(libraryId, shares.map((s) => s.userId));
        if (nonMembers.length > 0) {
          reply.code(400);
          return {
            error: 'Invalid share list',
            message: `Users are not members of this library: ${nonMembers.join(', ')}`,
          };
        }

        await prisma.$transaction([
          prisma.portalViewAccess.deleteMany({ where: { portalViewId } }),
          prisma.portalViewAccess.createMany({
            data: shares.map((s) => ({ portalViewId, userId: s.userId })),
          }),
        ]);

        return { message: 'Shares updated' };
      } catch (error) {
        request.log.error({ error }, 'Failed to update portal shares');
        reply.code(500);
        return { error: 'Failed to update portal shares' };
      }
    }
  );

  // ---------- Per-player aggregate (for the member management panel) ----------

  fastify.get<{ Params: { libraryId: string; userId: string } }>(
    '/:libraryId/player-shares/:userId',
    { schema: getPlayerSharesSchema, preHandler: [authenticateToken, requireEditorAccess] },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const userId = parseInt(request.params.userId, 10);

        const [items, dmScreens, portalViews] = await Promise.all([
          prisma.itemAccess.findMany({
            where: { userId, libraryItem: { libraryId } },
            include: { libraryItem: { select: { id: true, name: true, type: true } } },
          }),
          prisma.dmScreenAccess.findMany({
            where: { userId, dmScreen: { libraryId } },
            include: { dmScreen: { select: { id: true, name: true } } },
          }),
          prisma.portalViewAccess.findMany({
            where: { userId, portalView: { libraryId } },
            include: { portalView: { select: { id: true, name: true } } },
          }),
        ]);

        return {
          items: items.map((a) => ({
            id: a.libraryItem.id,
            name: a.libraryItem.name,
            type: a.libraryItem.type,
            permission: a.permission,
          })),
          dmScreens: dmScreens.map((a) => ({
            id: a.dmScreen.id,
            name: a.dmScreen.name,
            canEdit: a.canEdit,
          })),
          portalViews: portalViews.map((a) => ({
            id: a.portalView.id,
            name: a.portalView.name,
          })),
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to fetch player shares');
        reply.code(500);
        return { error: 'Failed to fetch player shares' };
      }
    }
  );
};
