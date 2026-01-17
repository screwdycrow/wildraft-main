import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireEditorAccess } from '../middleware/library-access';
import { LibraryItemType, Prisma } from '@prisma/client';
import { incrementItemsVersion } from '../utils/library-version';
import {
  createLibraryItemSchema,
  getLibraryItemsSchema,
  getLibraryItemSchema,
  updateLibraryItemSchema,
  deleteLibraryItemSchema,
} from '../schemas/library-item.schemas';
import {
  enrichUserFileWithDownloadUrl,
  enrichUserFilesWithDownloadUrls,
} from './user-files';

export const libraryItemRoutes = async (fastify: FastifyInstance) => {
  // Create a library item
  fastify.post<{
    Params: { libraryId: string };
    Body: {
      type: LibraryItemType;
      name: string;
      description?: string;
      data: any; // The flexible JSON data
      tagIds?: number[];
      userFileIds?: number[];
      featuredImageId?: number;
    };
  }>(
    '/:libraryId/items',
    { 
      schema: createLibraryItemSchema,
      preHandler: [authenticateToken, requireEditorAccess] 
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const { type, name, description, data, tagIds, userFileIds, featuredImageId } = request.body;

        // Validate required fields
        if (!type || !name || !data) {
          reply.code(400);
          return { error: 'Type, name, and data are required' };
        }

        // Use transaction to create item and increment version in a single round-trip
        const item = await prisma.$transaction(async (tx) => {
          const created = await tx.libraryItem.create({
            data: {
              libraryId,
              type,
              name,
              description,
              data, // Stores validated JSON with all fields (required + custom)
              ...(featuredImageId !== undefined && { featuredImageId: featuredImageId ?? null }),
              ...(tagIds && {
                tags: {
                  connect: tagIds.map(id => ({ id })),
                },
              }),
              ...(userFileIds && {
                userFiles: {
                  connect: userFileIds.map(id => ({ id })),
                },
              }),
            },
            include: {
              tags: true,
              featuredImage: true,
              userFiles: true,
            },
          });

          // Increment items version within the same transaction
          await incrementItemsVersion(libraryId, tx);

          return created;
        });

        // Add download URLs to featuredImage and userFiles
        const enrichedItem = {
          ...item,
          featuredImage: await enrichUserFileWithDownloadUrl(item.featuredImage),
          userFiles: await enrichUserFilesWithDownloadUrls(item.userFiles),
        };

        reply.code(201);
        return {
          message: 'Item created successfully',
          item: enrichedItem,
        };
      } catch (error) {
        console.error('Create item error:', error);
        reply.code(500);
        return {
          error: 'Failed to create item',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Get all items in a library
  fastify.get<{ Params: { libraryId: string } }>(
    '/:libraryId/items',
    { 
      schema: getLibraryItemsSchema,
      preHandler: authenticateToken 
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);

        const items = await prisma.libraryItem.findMany({
          where: { libraryId },
          include: {
            tags: true,
            featuredImage: true,
            userFiles: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        // Add download URLs to featuredImage and userFiles for all items
        const enrichedItems = await Promise.all(
          items.map(async (item) => ({
            ...item,
            featuredImage: await enrichUserFileWithDownloadUrl(item.featuredImage),
            userFiles: await enrichUserFilesWithDownloadUrls(item.userFiles),
          }))
        );

        return { items: enrichedItems };
      } catch (error) {
        console.error('Get items error:', error);
        reply.code(500);
        return {
          error: 'Failed to fetch items',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Get single item
  fastify.get<{ Params: { libraryId: string; itemId: string } }>(
    '/:libraryId/items/:itemId',
    { 
      schema: getLibraryItemSchema,
      preHandler: authenticateToken 
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const itemId = parseInt(request.params.itemId, 10);

        const item = await prisma.libraryItem.findFirst({
          where: {
            id: itemId,
            libraryId,
          },
          include: {
            tags: true,
            featuredImage: true,
            userFiles: true,
          },
        });

        if (!item) {
          reply.code(404);
          return { error: 'Item not found' };
        }

        // Add download URLs to featuredImage and userFiles
        const enrichedItem = {
          ...item,
          featuredImage: await enrichUserFileWithDownloadUrl(item.featuredImage),
          userFiles: await enrichUserFilesWithDownloadUrls(item.userFiles),
        };

        return { item: enrichedItem };
      } catch (error) {
        console.error('Get item error:', error);
        reply.code(500);
        return {
          error: 'Failed to fetch item',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Update item
  fastify.put<{
    Params: { libraryId: string; itemId: string };
    Body: {
      name?: string;
      description?: string;
      data?: any;
      tagIds?: number[];
      userFileIds?: number[];
      featuredImageId?: number | null;
    };
  }>(
    '/:libraryId/items/:itemId',
    { 
      schema: updateLibraryItemSchema,
      preHandler: [authenticateToken, requireEditorAccess] 
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const itemId = parseInt(request.params.itemId, 10);
        const { name, description, data, tagIds, userFileIds, featuredImageId } = request.body;

        // Use transaction to update item and increment version
        const item = await prisma.$transaction(async (tx) => {
          // Check existence and update in single query using updateMany with count check
          // Or use findFirst + update for cases where we need the result
          const existingItem = await tx.libraryItem.findFirst({
            where: { id: itemId, libraryId },
            select: { id: true }, // Only fetch what we need for validation
          });

          if (!existingItem) {
            return null; // Will handle 404 outside transaction
          }

          const updated = await tx.libraryItem.update({
            where: { id: itemId },
            data: {
              ...(name && { name }),
              ...(description !== undefined && { description }),
              ...(data && { data }),
              ...(featuredImageId !== undefined && { featuredImageId: featuredImageId ?? null }),
              ...(tagIds && {
                tags: {
                  set: [], // Clear existing
                  connect: tagIds.map(id => ({ id })),
                },
              }),
              ...(userFileIds && {
                userFiles: {
                  set: [], // Clear existing
                  connect: userFileIds.map(id => ({ id })),
                },
              }),
            },
            include: {
              tags: true,
              featuredImage: true,
              userFiles: true,
            },
          });

          // Increment items version within the same transaction
          await incrementItemsVersion(libraryId, tx);

          return updated;
        });

        if (!item) {
          reply.code(404);
          return { error: 'Item not found' };
        }

        // Add download URLs to featuredImage and userFiles
        const enrichedItem = {
          ...item,
          featuredImage: await enrichUserFileWithDownloadUrl(item.featuredImage),
          userFiles: await enrichUserFilesWithDownloadUrls(item.userFiles),
        };

        return {
          message: 'Item updated successfully',
          item: enrichedItem,
        };
      } catch (error) {
        console.error('Update item error:', error);
        reply.code(500);
        return {
          error: 'Failed to update item',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Delete item
  fastify.delete<{ Params: { libraryId: string; itemId: string } }>(
    '/:libraryId/items/:itemId',
    { 
      schema: deleteLibraryItemSchema,
      preHandler: [authenticateToken, requireEditorAccess] 
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const itemId = parseInt(request.params.itemId, 10);

        // Use transaction to delete and increment version together
        // Also handles the "not found" case elegantly
        const deleted = await prisma.$transaction(async (tx) => {
          // Use deleteMany to avoid throwing on not found, returns count
          const result = await tx.libraryItem.deleteMany({
            where: { 
              id: itemId, 
              libraryId, // Ensures item belongs to this library
            },
          });

          if (result.count === 0) {
            return false; // Item not found
          }

          // Increment items version within the same transaction
          await incrementItemsVersion(libraryId, tx);

          return true;
        });

        if (!deleted) {
          reply.code(404);
          return { error: 'Item not found' };
        }

        reply.code(204);
        return;
      } catch (error) {
        console.error('Delete item error:', error);
        reply.code(500);
        return {
          error: 'Failed to delete item',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );
};
