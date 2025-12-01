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
      folderId?: number | null;
      featuredImageId?: number | null;
      order?: number;
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
        const { name, color, folderId, featuredImageId, order } = request.body;

        if (!name) {
          reply.code(400);
          return { error: 'Tag name is required' };
        }

        // Use transaction to check for duplicate, validate folder/image, create, and increment version
        const result = await prisma.$transaction(async (tx) => {
          // Check if tag with this name already exists in the library
          const existingTag = await tx.tag.findFirst({
            where: { libraryId, name },
            select: { id: true },
          });

          if (existingTag) {
            return { error: 'duplicate' };
          }

          // Build create data object
          const createData: any = {
            libraryId,
            name,
            order: order ?? 0,
          };
          if (color) createData.color = color;
          
          // Handle folderId - validate if positive number, allow null to not set
          if (folderId !== undefined && folderId !== null) {
            if (typeof folderId === 'number' && folderId > 0) {
              // Validate the folder exists in this library
              const folder = await tx.tagFolder.findFirst({
                where: { id: folderId, libraryId },
              });
              if (!folder) {
                return { error: 'invalid_folder' };
              }
              createData.folderId = folderId;
            }
            // If folderId is 0 or negative, ignore it (don't set)
          }
          
          // Handle featuredImageId - validate if positive number, allow null to not set
          if (featuredImageId !== undefined && featuredImageId !== null) {
            if (typeof featuredImageId === 'number' && featuredImageId > 0) {
              // Validate the file exists
              const file = await tx.userFile.findFirst({
                where: { id: featuredImageId },
              });
              if (!file) {
                return { error: 'invalid_image' };
              }
              createData.featuredImageId = featuredImageId;
            }
            // If featuredImageId is 0 or negative, ignore it (don't set)
          }

          // Create the tag
          const tag = await tx.tag.create({
            data: createData,
            include: {
              folder: {
                select: {
                  id: true,
                  name: true,
                  order: true,
                },
              },
              featuredImage: {
                select: {
                  id: true,
                  fileName: true,
                  fileUrl: true,
                  fileType: true,
                },
              },
            },
          });

          // Increment tags version within the same transaction
          await incrementTagsVersion(libraryId, tx);

          return { tag };
        });

        if ('error' in result) {
          if (result.error === 'duplicate') {
            reply.code(409);
            return { error: 'Tag with this name already exists' };
          }
          if (result.error === 'invalid_folder') {
            reply.code(400);
            return { error: 'Invalid folder ID' };
          }
          if (result.error === 'invalid_image') {
            reply.code(400);
            return { error: 'Invalid featured image ID' };
          }
        }

        reply.code(201);
        return {
          message: 'Tag created successfully',
          tag: result.tag,
        };
      } catch (error) {
        request.log.error({ error }, 'Create tag error');
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
            folder: {
              select: {
                id: true,
                name: true,
                order: true,
              },
            },
            featuredImage: {
              select: {
                id: true,
                fileName: true,
                fileUrl: true,
                fileType: true,
              },
            },
          },
          orderBy: [
            { order: 'asc' },
            { name: 'asc' },
          ],
        });

        // Transform the response to include itemCount
        const tagsWithCount = tags.map((tag) => ({
          id: tag.id,
          name: tag.name,
          color: tag.color,
          order: tag.order,
          folderId: tag.folderId,
          folder: tag.folder,
          featuredImageId: tag.featuredImageId,
          featuredImage: tag.featuredImage,
          libraryId: tag.libraryId,
          itemCount: tag._count.libraryItems,
          createdAt: tag.createdAt,
          updatedAt: tag.updatedAt,
        }));

        return { tags: tagsWithCount };
      } catch (error) {
        request.log.error({ error }, 'Get tags error');
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
            folder: {
              select: {
                id: true,
                name: true,
                order: true,
              },
            },
            featuredImage: {
              select: {
                id: true,
                fileName: true,
                fileUrl: true,
                fileType: true,
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
        request.log.error({ error }, 'Get tag error');
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
      folderId?: number | null;
      featuredImageId?: number | null;
      order?: number;
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
        
        // Validate tagId
        if (isNaN(tagId) || tagId <= 0) {
          reply.code(400);
          return { error: 'Invalid tag ID' };
        }
        
        const body = request.body as any;
        const { name, color, order } = body;
        
        // Check if folderId and featuredImageId keys exist in the body
        const hasFolderId = 'folderId' in body;
        const hasFeaturedImageId = 'featuredImageId' in body;
        const folderId = body.folderId;
        const featuredImageId = body.featuredImageId;

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

          // Build update data object - only include fields that are being updated
          const updateData: any = {};
          if (name) updateData.name = name;
          if (color) updateData.color = color;
          if (order !== undefined) updateData.order = order;
          
          // Handle folderId - check if the key was in the request body
          if (hasFolderId) {
            if (folderId === null || folderId === 0 || folderId === undefined) {
              // Clear the folder
              updateData.folderId = null;
            } else if (typeof folderId === 'number' && folderId > 0) {
              // Validate the folder exists in this library
              const folder = await tx.tagFolder.findFirst({
                where: { id: folderId, libraryId },
              });
              if (!folder) {
                return { error: 'invalid_folder' };
              }
              updateData.folderId = folderId;
            }
          }
          
          // Handle featuredImageId - check if the key was in the request body
          if (hasFeaturedImageId) {
            if (featuredImageId === null || featuredImageId === 0 || featuredImageId === undefined) {
              // Clear the featured image
              updateData.featuredImageId = null;
            } else if (typeof featuredImageId === 'number' && featuredImageId > 0) {
              // Validate the file exists
              const file = await tx.userFile.findFirst({
                where: { id: featuredImageId },
              });
              if (!file) {
                return { error: 'invalid_image' };
              }
              updateData.featuredImageId = featuredImageId;
            }
          }

          // Update the tag
          const tag = await tx.tag.update({
            where: { id: tagId },
            data: updateData,
            include: {
              folder: {
                select: {
                  id: true,
                  name: true,
                  order: true,
                },
              },
              featuredImage: {
                select: {
                  id: true,
                  fileName: true,
                  fileUrl: true,
                  fileType: true,
                },
              },
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
          if (result.error === 'invalid_folder') {
            reply.code(400);
            return { error: 'Invalid folder ID' };
          }
          if (result.error === 'invalid_image') {
            reply.code(400);
            return { error: 'Invalid featured image ID' };
          }
        }

        return {
          message: 'Tag updated successfully',
          tag: result.tag,
        };
      } catch (error) {
        request.log.error({ error }, 'Update tag error');
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
        request.log.error({ error }, 'Delete tag error');
        reply.code(500);
        return {
          error: 'Failed to delete tag',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );
};
