import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireEditorAccess } from '../middleware/library-access';
import { incrementTagsVersion } from '../utils/library-version';
import {
  createTagSchema,
  getLibraryTagsSchema,
  getTagSchema,
  updateTagSchema,
  deleteTagSchema,
} from '../schemas/tag.schemas';

export const tagRoutes = async (fastify: FastifyInstance) => {
  // Create a tag
  fastify.post<{
    Params: { libraryId: string };
    Body: {
      name: string;
      color?: string;
      folder?: string | null;
    };
  }>(
    '/:libraryId/tags',
    {
      schema: createTagSchema,
      preHandler: [authenticateToken, requireEditorAccess]
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const { name, color, folder } = request.body;

        if (!name) {
          reply.code(400);
          return { error: 'Tag name is required' };
        }

        // Use transaction to check for duplicate, create, and increment version
        const result = await prisma.$transaction(async (tx) => {
          // Check if tag with this name already exists in the library
          const existingTag = await tx.tag.findFirst({
            where: { libraryId, name },
            select: { id: true },
          });

          if (existingTag) {
            return { error: 'duplicate' };
          }

          // Create the tag
          const tag = await tx.tag.create({
            data: {
              libraryId,
              name,
              ...(color && { color }),
              ...(folder !== undefined && { folder: folder?.trim() || null }),
            },
          });

          // Increment tags version within the same transaction
          await incrementTagsVersion(libraryId, tx);

          return { tag };
        });

        if ('error' in result && result.error === 'duplicate') {
          reply.code(409);
          return { error: 'Tag with this name already exists' };
        }

        reply.code(201);
        return {
          message: 'Tag created successfully',
          tag: result.tag,
        };
      } catch (error) {
        console.error('Create tag error:', error);
        reply.code(500);
        return {
          error: 'Failed to create tag',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Get all tags in a library
  fastify.get<{ Params: { libraryId: string } }>(
    '/:libraryId/tags',
    {
      schema: getLibraryTagsSchema,
      preHandler: authenticateToken
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);

        const tags = await prisma.tag.findMany({
          where: { libraryId },
          include: {
            _count: {
              select: { libraryItems: true },
            },
          },
          orderBy: {
            name: 'asc',
          },
        });

        // Transform the response to include itemCount
        const tagsWithCount = tags.map((tag) => ({
          id: tag.id,
          name: tag.name,
          color: tag.color,
          folder: (tag as any).folder ?? null,
          libraryId: tag.libraryId,
          itemCount: tag._count.libraryItems,
          createdAt: tag.createdAt,
          updatedAt: tag.updatedAt,
        }));

        return { tags: tagsWithCount };
      } catch (error) {
        console.error('Get tags error:', error);
        reply.code(500);
        return {
          error: 'Failed to fetch tags',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Get single tag with its items
  fastify.get<{ Params: { libraryId: string; tagId: string } }>(
    '/:libraryId/tags/:tagId',
    {
      schema: getTagSchema,
      preHandler: authenticateToken
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const tagId = parseInt(request.params.tagId, 10);

        const tag = await prisma.tag.findFirst({
          where: {
            id: tagId,
            libraryId,
          },
          include: {
            libraryItems: {
              select: {
                id: true,
                name: true,
                type: true,
                description: true,
              },
            },
          },
        });

        if (!tag) {
          reply.code(404);
          return { error: 'Tag not found' };
        }

        return { tag };
      } catch (error) {
        console.error('Get tag error:', error);
        reply.code(500);
        return {
          error: 'Failed to fetch tag',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Update tag
  fastify.put<{
    Params: { libraryId: string; tagId: string };
    Body: {
      name?: string;
      color?: string;
      folder?: string | null;
    };
  }>(
    '/:libraryId/tags/:tagId',
    {
      schema: updateTagSchema,
      preHandler: [authenticateToken, requireEditorAccess]
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const tagId = parseInt(request.params.tagId, 10);
        const { name, color, folder } = request.body;

        // Use transaction to validate, update, and increment version
        const result = await prisma.$transaction(async (tx) => {
          // Verify tag exists in this library
          const existingTag = await tx.tag.findFirst({
            where: { id: tagId, libraryId },
            select: { id: true, name: true },
          });

          if (!existingTag) {
            return { error: 'not_found' };
          }

          // If updating name, check for duplicates in a single query
          if (name && name !== existingTag.name) {
            const duplicateTag = await tx.tag.findFirst({
              where: {
                libraryId,
                name,
                id: { not: tagId },
              },
              select: { id: true },
            });

            if (duplicateTag) {
              return { error: 'duplicate' };
            }
          }

          // Update the tag
          const tag = await tx.tag.update({
            where: { id: tagId },
            data: {
              ...(name && { name }),
              ...(color && { color }),
              ...(folder !== undefined && { folder: folder?.trim() || null }),
            },
          });

          // Increment tags version within the same transaction
          await incrementTagsVersion(libraryId, tx);

          return { tag };
        });

        if ('error' in result) {
          if (result.error === 'not_found') {
            reply.code(404);
            return { error: 'Tag not found' };
          }
          if (result.error === 'duplicate') {
            reply.code(409);
            return { error: 'Tag with this name already exists' };
          }
        }

        return {
          message: 'Tag updated successfully',
          tag: result.tag,
        };
      } catch (error) {
        console.error('Update tag error:', error);
        reply.code(500);
        return {
          error: 'Failed to update tag',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Delete tag
  fastify.delete<{ Params: { libraryId: string; tagId: string } }>(
    '/:libraryId/tags/:tagId',
    {
      schema: deleteTagSchema,
      preHandler: [authenticateToken, requireEditorAccess]
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const tagId = parseInt(request.params.tagId, 10);

        // Use transaction to delete and increment version together
        const deleted = await prisma.$transaction(async (tx) => {
          // Use deleteMany to avoid throwing on not found
          const result = await tx.tag.deleteMany({
            where: { 
              id: tagId, 
              libraryId, // Ensures tag belongs to this library
            },
          });

          if (result.count === 0) {
            return false;
          }

          // Increment tags version within the same transaction
          await incrementTagsVersion(libraryId, tx);

          return true;
        });

        if (!deleted) {
          reply.code(404);
          return { error: 'Tag not found' };
        }

        reply.code(204);
        return;
      } catch (error) {
        console.error('Delete tag error:', error);
        reply.code(500);
        return {
          error: 'Failed to delete tag',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );
};
