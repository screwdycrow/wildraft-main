import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireEditorAccess } from '../middleware/library-access';
import { LibraryItemType } from '@prisma/client';
import {
  createLibraryItemSchema,
  getLibraryItemsSchema,
  getLibraryItemSchema,
  updateLibraryItemSchema,
  deleteLibraryItemSchema,
} from '../schemas/library-item.schemas';

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

        // Create the item
        const item = await prisma.libraryItem.create({
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

        reply.code(201);
        return {
          message: 'Item created successfully',
          item,
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

        return { items };
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

        return { item };
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

        // Get existing item to validate type
        const existingItem = await prisma.libraryItem.findFirst({
          where: { id: itemId, libraryId },
        });

        if (!existingItem) {
          reply.code(404);
          return { error: 'Item not found' };
        }

        // Update item
        const item = await prisma.libraryItem.update({
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

        return {
          message: 'Item updated successfully',
          item,
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

        // Verify item exists in this library
        const item = await prisma.libraryItem.findFirst({
          where: { id: itemId, libraryId },
        });

        if (!item) {
          reply.code(404);
          return { error: 'Item not found' };
        }

        await prisma.libraryItem.delete({
          where: { id: itemId },
        });

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

