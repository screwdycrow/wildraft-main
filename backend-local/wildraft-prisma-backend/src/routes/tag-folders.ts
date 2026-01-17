import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireEditorAccess, requireViewerAccess } from '../middleware/library-access';
import { incrementTagsVersion } from '../utils/library-version';
import {
  createTagFolderSchema,
  getLibraryTagFoldersSchema,
  getTagFolderSchema,
  updateTagFolderSchema,
  deleteTagFolderSchema,
} from '../schemas/tag-folder.schemas';

export const tagFolderRoutes = async (fastify: FastifyInstance) => {
  // Create a tag folder
  fastify.post<{
    Params: { libraryId: string };
    Body: {
      name: string;
      order?: number;
    };
  }>(
    '/:libraryId/tag-folders',
    {
      schema: createTagFolderSchema,
      preHandler: [authenticateToken, requireEditorAccess]
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const { name, order } = request.body;

        if (!name || name.trim().length === 0) {
          reply.code(400);
          return { error: 'Folder name is required' };
        }

        // Use transaction to check for duplicate, create, and increment version
        const result = await prisma.$transaction(async (tx) => {
          // Check if folder with this name already exists in the library
          const existingFolder = await tx.tagFolder.findFirst({
            where: { libraryId, name: name.trim() },
            select: { id: true },
          });

          if (existingFolder) {
            return { error: 'duplicate' };
          }

          // Create the folder
          const folder = await tx.tagFolder.create({
            data: {
              libraryId,
              name: name.trim(),
              order: order ?? 0,
            },
          });

          // Increment tags version within the same transaction
          await incrementTagsVersion(libraryId, tx);

          return { folder };
        });

        if ('error' in result && result.error === 'duplicate') {
          reply.code(409);
          return { error: 'Folder with this name already exists' };
        }

        reply.code(201);
        return {
          message: 'Tag folder created successfully',
          folder: result.folder,
        };
      } catch (error) {
        request.log.error({ error }, 'Create tag folder error');
        reply.code(500);
        return {
          error: 'Failed to create tag folder',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Get all tag folders in a library
  fastify.get<{ Params: { libraryId: string } }>(
    '/:libraryId/tag-folders',
    {
      schema: getLibraryTagFoldersSchema,
      preHandler: [authenticateToken, requireViewerAccess]
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);

        const folders = await prisma.tagFolder.findMany({
          where: { libraryId },
          include: {
            _count: {
              select: { tags: true },
            },
          },
          orderBy: [
            { order: 'asc' },
            { name: 'asc' },
          ],
        });

        // Transform the response to include tagCount
        const foldersWithCount = folders.map((folder) => ({
          id: folder.id,
          name: folder.name,
          order: folder.order,
          libraryId: folder.libraryId,
          tagCount: folder._count.tags,
          createdAt: folder.createdAt,
          updatedAt: folder.updatedAt,
        }));

        return { folders: foldersWithCount };
      } catch (error) {
        request.log.error({ error }, 'Get tag folders error');
        reply.code(500);
        return {
          error: 'Failed to fetch tag folders',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Get single tag folder with its tags
  fastify.get<{ Params: { libraryId: string; folderId: string } }>(
    '/:libraryId/tag-folders/:folderId',
    {
      schema: getTagFolderSchema,
      preHandler: [authenticateToken, requireViewerAccess]
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const folderId = parseInt(request.params.folderId, 10);

        const folder = await prisma.tagFolder.findFirst({
          where: {
            id: folderId,
            libraryId,
          },
          include: {
            tags: {
              select: {
                id: true,
                name: true,
                color: true,
                order: true,
              },
              orderBy: [
                { order: 'asc' },
                { name: 'asc' },
              ],
            },
          },
        });

        if (!folder) {
          reply.code(404);
          return { error: 'Tag folder not found' };
        }

        return { folder };
      } catch (error) {
        request.log.error({ error }, 'Get tag folder error');
        reply.code(500);
        return {
          error: 'Failed to fetch tag folder',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Update tag folder
  fastify.put<{
    Params: { libraryId: string; folderId: string };
    Body: {
      name?: string;
      order?: number;
    };
  }>(
    '/:libraryId/tag-folders/:folderId',
    {
      schema: updateTagFolderSchema,
      preHandler: [authenticateToken, requireEditorAccess]
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const folderId = parseInt(request.params.folderId, 10);
        const { name, order } = request.body;

        // Use transaction to validate, update, and increment version
        const result = await prisma.$transaction(async (tx) => {
          // Verify folder exists in this library
          const existingFolder = await tx.tagFolder.findFirst({
            where: { id: folderId, libraryId },
            select: { id: true, name: true },
          });

          if (!existingFolder) {
            return { error: 'not_found' };
          }

          // If updating name, check for duplicates
          if (name && name.trim() !== existingFolder.name) {
            const duplicateFolder = await tx.tagFolder.findFirst({
              where: {
                libraryId,
                name: name.trim(),
                id: { not: folderId },
              },
              select: { id: true },
            });

            if (duplicateFolder) {
              return { error: 'duplicate' };
            }
          }

          // Update the folder
          const folder = await tx.tagFolder.update({
            where: { id: folderId },
            data: {
              ...(name && { name: name.trim() }),
              ...(order !== undefined && { order }),
            },
          });

          // Increment tags version within the same transaction
          await incrementTagsVersion(libraryId, tx);

          return { folder };
        });

        if ('error' in result) {
          if (result.error === 'not_found') {
            reply.code(404);
            return { error: 'Tag folder not found' };
          }
          if (result.error === 'duplicate') {
            reply.code(409);
            return { error: 'Folder with this name already exists' };
          }
        }

        return {
          message: 'Tag folder updated successfully',
          folder: result.folder,
        };
      } catch (error) {
        request.log.error({ error }, 'Update tag folder error');
        reply.code(500);
        return {
          error: 'Failed to update tag folder',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Delete tag folder
  fastify.delete<{ Params: { libraryId: string; folderId: string } }>(
    '/:libraryId/tag-folders/:folderId',
    {
      schema: deleteTagFolderSchema,
      preHandler: [authenticateToken, requireEditorAccess]
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const folderId = parseInt(request.params.folderId, 10);

        // Use transaction to delete and increment version together
        const deleted = await prisma.$transaction(async (tx) => {
          // Verify folder exists in this library
          const folder = await tx.tagFolder.findFirst({
            where: { id: folderId, libraryId },
          });

          if (!folder) {
            return false;
          }

          // Delete the folder (tags will have folderId set to null due to onDelete: SetNull)
          await tx.tagFolder.delete({
            where: { id: folderId },
          });

          // Increment tags version within the same transaction
          await incrementTagsVersion(libraryId, tx);

          return true;
        });

        if (!deleted) {
          reply.code(404);
          return { error: 'Tag folder not found' };
        }

        reply.code(204);
        return;
      } catch (error) {
        request.log.error({ error }, 'Delete tag folder error');
        reply.code(500);
        return {
          error: 'Failed to delete tag folder',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );
};

