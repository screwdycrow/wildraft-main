import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireEditorAccess } from '../middleware/library-access';
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
        const { name, color } = request.body;

        if (!name) {
          reply.code(400);
          return { error: 'Tag name is required' };
        }

        // Check if tag with this name already exists in the library
        const existingTag = await prisma.tag.findFirst({
          where: {
            libraryId,
            name,
          },
        });

        if (existingTag) {
          reply.code(409);
          return { error: 'Tag with this name already exists' };
        }

        // Create the tag
        const tag = await prisma.tag.create({
          data: {
            libraryId,
            name,
            ...(color && { color }),
          },
        });

        reply.code(201);
        return {
          message: 'Tag created successfully',
          tag,
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
        const { name, color } = request.body;

        // Verify tag exists in this library
        const existingTag = await prisma.tag.findFirst({
          where: { id: tagId, libraryId },
        });

        if (!existingTag) {
          reply.code(404);
          return { error: 'Tag not found' };
        }

        // If updating name, check for duplicates
        if (name && name !== existingTag.name) {
          const duplicateTag = await prisma.tag.findFirst({
            where: {
              libraryId,
              name,
              id: { not: tagId },
            },
          });

          if (duplicateTag) {
            reply.code(409);
            return { error: 'Tag with this name already exists' };
          }
        }

        // Update the tag
        const tag = await prisma.tag.update({
          where: { id: tagId },
          data: {
            ...(name && { name }),
            ...(color && { color }),
          },
        });

        return {
          message: 'Tag updated successfully',
          tag,
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

        // Verify tag exists in this library
        const tag = await prisma.tag.findFirst({
          where: { id: tagId, libraryId },
        });

        if (!tag) {
          reply.code(404);
          return { error: 'Tag not found' };
        }

        // Delete the tag (will automatically remove from all items due to Prisma relations)
        await prisma.tag.delete({
          where: { id: tagId },
        });

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

