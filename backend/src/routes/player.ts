import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireMemberAccess } from '../middleware/library-access';
import { AccessRole, ItemPermission } from '@prisma/client';
import { enrichUserFileWithDownloadUrl } from './user-files';
import { getSharedContentSchema } from '../schemas/player.schemas';

/**
 * Player-scoped content routes.
 * Registered under the /api/libraries prefix.
 */
export const playerRoutes = async (fastify: FastifyInstance) => {
  // Everything shared with the current user in this library.
  // PLAYER: only explicitly shared content. VIEWER+: the whole library
  // (so a DM can preview the player dashboard).
  fastify.get<{ Params: { libraryId: string } }>(
    '/:libraryId/player/shared-content',
    { schema: getSharedContentSchema, preHandler: [authenticateToken, requireMemberAccess] },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const userId = request.user!.userId;
        const role = request.libraryAccess!.role;
        const isPlayer = role === AccessRole.PLAYER;

        const library = await prisma.library.findUnique({
          where: { id: libraryId },
          select: { id: true, name: true, description: true },
        });
        if (!library) {
          reply.code(404);
          return { error: 'Library not found' };
        }

        const [items, dmScreens, portalViews] = await Promise.all([
          isPlayer
            ? prisma.itemAccess
                .findMany({
                  where: { userId, libraryItem: { libraryId } },
                  include: { libraryItem: { include: { featuredImage: true } } },
                  orderBy: { libraryItem: { name: 'asc' } },
                })
                .then((rows) =>
                  rows.map((a) => ({ item: a.libraryItem, permission: a.permission }))
                )
            : prisma.libraryItem
                .findMany({
                  where: { libraryId },
                  include: { featuredImage: true },
                  orderBy: { name: 'asc' },
                })
                .then((rows) =>
                  rows.map((item) => ({ item, permission: ItemPermission.EDIT }))
                ),
          isPlayer
            ? prisma.dmScreenAccess
                .findMany({
                  where: { userId, dmScreen: { libraryId } },
                  include: { dmScreen: { select: { id: true, name: true, updatedAt: true } } },
                })
                .then((rows) =>
                  rows.map((a) => ({ ...a.dmScreen, canEdit: a.canEdit }))
                )
            : prisma.dMScreen
                .findMany({
                  where: { libraryId },
                  select: { id: true, name: true, updatedAt: true },
                })
                .then((rows) => rows.map((s) => ({ ...s, canEdit: true }))),
          isPlayer
            ? prisma.portalViewAccess
                .findMany({
                  where: { userId, portalView: { libraryId } },
                  include: { portalView: { select: { id: true, name: true } } },
                })
                .then((rows) => rows.map((a) => a.portalView))
            : prisma.portalView.findMany({
                where: { libraryId },
                select: { id: true, name: true },
              }),
        ]);

        const enrichedItems = await Promise.all(
          items.map(async ({ item, permission }) => ({
            id: item.id,
            name: item.name,
            type: item.type,
            description: item.description,
            color: item.color,
            permission,
            featuredImage: await enrichUserFileWithDownloadUrl(item.featuredImage),
          }))
        );

        return {
          library,
          role,
          items: enrichedItems,
          dmScreens,
          portalViews,
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to fetch shared content');
        reply.code(500);
        return {
          error: 'Failed to fetch shared content',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );
};
