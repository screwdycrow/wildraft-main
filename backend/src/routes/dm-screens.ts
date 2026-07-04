import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireEditorAccess, requireViewerAccess, requireMemberAccess } from '../middleware/library-access';
import { AccessRole } from '@prisma/client';
import crypto from 'crypto';
import { getDmScreenAccess, getPlayerDmScreenAccess, getViewableItemIds } from '../lib/player-access';
import { broadcastDmScreenUpdate } from '../websocket/dm-screen-socket';

// Node types a player may create on a shared DM screen
const PLAYER_CREATABLE_TYPES = new Set([
  'quickNote',
  'TextNode',
  'ShapeNode',
  'timer',
  'counter',
  'LibraryItemId',
]);

const canPlayerTouchItem = (item: any, userId: number): boolean =>
  item?.data?.createdBy === userId ||
  (Array.isArray(item?.controlledBy) && item.controlledBy.includes(userId));
import {
  createDMScreenSchema,
  getDMScreensSchema,
  getDMScreenSchema,
  updateDMScreenSchema,
  deleteDMScreenSchema,
} from '../schemas/dm-screen.schemas';
import { validateFlexibleJson } from '../utils/json-validation';

export const dmScreenRoutes = async (fastify: FastifyInstance) => {
  // Create a DM screen
  fastify.post<{
    Params: { libraryId: string };
    Body: {
      name: string;
      items?: any;
      settings?: any;
    };
  }>(
    '/:libraryId/dm-screens',
    { 
      schema: createDMScreenSchema,
      preHandler: [authenticateToken, requireEditorAccess] 
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const { name, items, settings } = request.body;

        // Validate required fields
        if (!name) {
          reply.code(400);
          return { error: 'Name is required' };
        }

        // Validate items JSON if provided
        if (items !== undefined && items !== null) {
          const itemsValidation = validateFlexibleJson(items, { mustBeArray: true });
          if (!itemsValidation.valid) {
            reply.code(400);
            return { error: itemsValidation.error || 'Invalid items format' };
          }
        }

        // Validate settings JSON if provided
        if (settings !== undefined && settings !== null) {
          const settingsValidation = validateFlexibleJson(settings);
          if (!settingsValidation.valid) {
            reply.code(400);
            return { error: settingsValidation.error || 'Invalid settings format' };
          }
        }

        // Create the DM screen
        const dmScreen = await prisma.dMScreen.create({
          data: {
            libraryId,
            name,
            items: items !== undefined ? items : null,
            settings: settings !== undefined ? settings : null,
          },
        });

        reply.code(201);
        return {
          message: 'DM screen created successfully',
          dmScreen,
        };
      } catch (error) {
        console.error('Create DM screen error:', error);
        reply.code(500);
        return {
          error: 'Failed to create DM screen',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Get all DM screens in a library
  fastify.get<{ Params: { libraryId: string } }>(
    '/:libraryId/dm-screens',
    {
      schema: getDMScreensSchema,
      preHandler: [authenticateToken, requireViewerAccess]
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);

        const dmScreens = await prisma.dMScreen.findMany({
          where: { libraryId },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return { dmScreens };
      } catch (error) {
        console.error('Get DM screens error:', error);
        reply.code(500);
        return {
          error: 'Failed to fetch DM screens',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Get single DM screen (players: explicit share OR embedded in a shared portal)
  fastify.get<{ Params: { libraryId: string; dmScreenId: string } }>(
    '/:libraryId/dm-screens/:dmScreenId',
    {
      schema: getDMScreenSchema,
      preHandler: [authenticateToken, requireMemberAccess]
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const dmScreenId = request.params.dmScreenId;

        const isPlayer = request.libraryAccess!.role === AccessRole.PLAYER;
        if (isPlayer) {
          const access = await getPlayerDmScreenAccess(request.user!.userId, dmScreenId);
          if (!access) {
            reply.code(403);
            return { error: 'Access denied', message: 'This DM screen has not been shared with you' };
          }
        }

        const dmScreen = await prisma.dMScreen.findFirst({
          where: {
            id: dmScreenId,
            libraryId,
          },
        });

        if (!dmScreen) {
          reply.code(404);
          return { error: 'DM screen not found' };
        }

        // Players: redact LibraryItemId nodes they can't view (the node data
        // itself can leak names/stats). Keep position so layout is preserved.
        if (isPlayer && Array.isArray(dmScreen.items)) {
          const viewable = await getViewableItemIds(request.user!.userId, libraryId);
          const redactedItems = (dmScreen.items as any[]).map((item) => {
            const refId = item?.data?.id ?? item?.data?.libraryItemId;
            if (item?.type === 'LibraryItemId' && !viewable.has(Number(refId))) {
              return {
                ...item,
                data: { libraryItemId: Number(refId) || null, locked: true },
              };
            }
            return item;
          });
          return { dmScreen: { ...dmScreen, items: redactedItems } };
        }

        return { dmScreen };
      } catch (error) {
        console.error('Get DM screen error:', error);
        reply.code(500);
        return {
          error: 'Failed to fetch DM screen',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Update DM screen
  fastify.put<{
    Params: { libraryId: string; dmScreenId: string };
    Body: {
      name?: string;
      items?: any;
      settings?: any;
    };
  }>(
    '/:libraryId/dm-screens/:dmScreenId',
    { 
      schema: updateDMScreenSchema,
      preHandler: [authenticateToken, requireEditorAccess] 
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const dmScreenId = request.params.dmScreenId;
        const { name, items, settings } = request.body;

        // Verify DM screen exists in this library
        const existingDMScreen = await prisma.dMScreen.findFirst({
          where: { id: dmScreenId, libraryId },
        });

        if (!existingDMScreen) {
          reply.code(404);
          return { error: 'DM screen not found' };
        }

        // Validate items JSON if provided
        if (items !== undefined && items !== null) {
          const itemsValidation = validateFlexibleJson(items, { mustBeArray: true });
          if (!itemsValidation.valid) {
            reply.code(400);
            return { error: itemsValidation.error || 'Invalid items format' };
          }
        }

        // Validate settings JSON if provided
        if (settings !== undefined && settings !== null) {
          const settingsValidation = validateFlexibleJson(settings);
          if (!settingsValidation.valid) {
            reply.code(400);
            return { error: settingsValidation.error || 'Invalid settings format' };
          }
        }

        // Build update data object
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (items !== undefined) updateData.items = items;
        if (settings !== undefined) updateData.settings = settings;

        // Update DM screen
        const dmScreen = await prisma.dMScreen.update({
          where: { id: dmScreenId },
          data: updateData,
        });

        broadcastDmScreenUpdate(fastify, dmScreenId, { sourceUserId: request.user!.userId });

        return {
          message: 'DM screen updated successfully',
          dmScreen,
        };
      } catch (error) {
        console.error('Update DM screen error:', error);
        reply.code(500);
        return {
          error: 'Failed to update DM screen',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Player-scoped item merge: players (with canEdit) upsert/delete ONLY items
  // they created or control. EDITOR+ passes through the same validation-free path.
  fastify.patch<{
    Params: { libraryId: string; dmScreenId: string };
    Body: { upserts?: any[]; deleteIds?: string[] };
  }>(
    '/:libraryId/dm-screens/:dmScreenId/player-items',
    { preHandler: [authenticateToken, requireMemberAccess] },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const dmScreenId = request.params.dmScreenId;
        const userId = request.user!.userId;
        const role = request.libraryAccess!.role;
        const isPlayer = role === AccessRole.PLAYER;

        const upserts = Array.isArray(request.body?.upserts) ? request.body.upserts : [];
        const deleteIds = Array.isArray(request.body?.deleteIds) ? request.body.deleteIds : [];
        if (upserts.length === 0 && deleteIds.length === 0) {
          reply.code(400);
          return { error: 'Nothing to update' };
        }

        if (isPlayer) {
          const access = await getDmScreenAccess(userId, dmScreenId);
          if (!access?.canEdit) {
            reply.code(403);
            return { error: 'Access denied', message: 'You cannot edit this DM screen' };
          }
        } else if (role === AccessRole.VIEWER) {
          reply.code(403);
          return { error: 'Insufficient permissions' };
        }

        const viewable = isPlayer ? await getViewableItemIds(userId, libraryId) : null;

        const dmScreen = await prisma.$transaction(async (tx) => {
          const current = await tx.dMScreen.findFirst({ where: { id: dmScreenId, libraryId } });
          if (!current) return null;

          const items: any[] = Array.isArray(current.items) ? [...(current.items as any[])] : [];
          const byId = new Map(items.map((item, index) => [item?.id, index]));

          // Deletes: players may only remove their own/controlled items
          for (const id of deleteIds) {
            const index = byId.get(id);
            if (index === undefined) continue;
            if (isPlayer && !canPlayerTouchItem(items[index], userId)) {
              throw Object.assign(new Error('You cannot delete this item'), { statusCode: 403 });
            }
            items[index] = null;
          }

          for (const incoming of upserts) {
            if (!incoming?.id || typeof incoming.id !== 'string') continue;
            const index = byId.get(incoming.id);

            if (index !== undefined && items[index]) {
              // Update existing
              const existing = items[index];
              if (isPlayer && !canPlayerTouchItem(existing, userId)) {
                throw Object.assign(new Error('You cannot modify this item'), { statusCode: 403 });
              }
              items[index] = isPlayer
                ? {
                    ...incoming,
                    id: existing.id,
                    type: existing.type, // players cannot change type
                    controlledBy: existing.controlledBy, // or grant themselves control
                    data: { ...incoming.data, createdBy: existing.data?.createdBy },
                  }
                : incoming;
            } else {
              // Create new
              if (isPlayer) {
                if (!PLAYER_CREATABLE_TYPES.has(incoming.type)) {
                  throw Object.assign(new Error(`Players cannot add ${incoming.type} items`), {
                    statusCode: 403,
                  });
                }
                if (incoming.type === 'LibraryItemId') {
                  const refId = Number(incoming?.data?.id ?? incoming?.data?.libraryItemId);
                  if (!viewable!.has(refId)) {
                    throw Object.assign(new Error('You cannot add an item that is not shared with you'), {
                      statusCode: 403,
                    });
                  }
                }
                delete incoming.controlledBy;
                incoming.data = { ...incoming.data, createdBy: userId };
              }
              items.push(incoming);
            }
          }

          return tx.dMScreen.update({
            where: { id: dmScreenId },
            data: { items: items.filter((item) => item !== null) },
          });
        });

        if (!dmScreen) {
          reply.code(404);
          return { error: 'DM screen not found' };
        }

        broadcastDmScreenUpdate(fastify, dmScreenId, { sourceUserId: userId });
        return { message: 'Items updated', dmScreen };
      } catch (error: any) {
        if (error?.statusCode === 403) {
          reply.code(403);
          return { error: 'Access denied', message: error.message };
        }
        console.error('Player items update error:', error);
        reply.code(500);
        return {
          error: 'Failed to update items',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Copy the DM-screen items assigned to a player (or all players) from a
  // source screen onto this one, with fresh ids.
  fastify.post<{
    Params: { libraryId: string; dmScreenId: string };
    Body: { sourceDmScreenId: string; userId?: number };
  }>(
    '/:libraryId/dm-screens/:dmScreenId/copy-player-items',
    { preHandler: [authenticateToken, requireEditorAccess] },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const dmScreenId = request.params.dmScreenId;
        const { sourceDmScreenId, userId: targetUserId } = request.body ?? {};

        if (!sourceDmScreenId) {
          reply.code(400);
          return { error: 'sourceDmScreenId is required' };
        }

        const [source, target] = await Promise.all([
          prisma.dMScreen.findFirst({ where: { id: sourceDmScreenId, libraryId } }),
          prisma.dMScreen.findFirst({ where: { id: dmScreenId, libraryId } }),
        ]);
        if (!source || !target) {
          reply.code(404);
          return { error: 'DM screen not found' };
        }

        const sourceItems: any[] = Array.isArray(source.items) ? (source.items as any[]) : [];
        const toCopy = sourceItems.filter(
          (item) =>
            Array.isArray(item?.controlledBy) &&
            item.controlledBy.length > 0 &&
            (targetUserId == null || item.controlledBy.includes(targetUserId))
        );

        if (toCopy.length === 0) {
          return { message: 'No player-controlled items to copy', copiedCount: 0, dmScreen: target };
        }

        const copies = toCopy.map((item) => ({
          ...JSON.parse(JSON.stringify(item)),
          id: crypto.randomUUID(),
        }));

        const targetItems: any[] = Array.isArray(target.items) ? (target.items as any[]) : [];
        const dmScreen = await prisma.dMScreen.update({
          where: { id: dmScreenId },
          data: { items: [...targetItems, ...copies] },
        });

        broadcastDmScreenUpdate(fastify, dmScreenId, { sourceUserId: request.user!.userId });
        return { message: 'Player items copied', copiedCount: copies.length, dmScreen };
      } catch (error) {
        console.error('Copy player items error:', error);
        reply.code(500);
        return {
          error: 'Failed to copy player items',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Delete DM screen
  fastify.delete<{ Params: { libraryId: string; dmScreenId: string } }>(
    '/:libraryId/dm-screens/:dmScreenId',
    { 
      schema: deleteDMScreenSchema,
      preHandler: [authenticateToken, requireEditorAccess] 
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const dmScreenId = request.params.dmScreenId;

        // Verify DM screen exists in this library
        const dmScreen = await prisma.dMScreen.findFirst({
          where: { id: dmScreenId, libraryId },
        });

        if (!dmScreen) {
          reply.code(404);
          return { error: 'DM screen not found' };
        }

        await prisma.dMScreen.delete({
          where: { id: dmScreenId },
        });

        reply.code(204);
        return;
      } catch (error) {
        console.error('Delete DM screen error:', error);
        reply.code(500);
        return {
          error: 'Failed to delete DM screen',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );
};

