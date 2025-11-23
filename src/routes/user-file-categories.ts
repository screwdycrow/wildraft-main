import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireEditorAccess, requireViewerAccess } from '../middleware/library-access';
import {
  createUserFileCategorySchema,
  getLibraryFileCategoriesSchema,
  getUserFileCategorySchema,
  updateUserFileCategorySchema,
  deleteUserFileCategorySchema,
} from '../schemas/user-file-category.schemas';

export const userFileCategoryRoutes = async (fastify: FastifyInstance) => {
  // Create a file category
  fastify.post<{
    Params: { libraryId: string };
    Body: {
      name: string;
    };
  }>(
    '/:libraryId/file-categories',
    {
      schema: createUserFileCategorySchema,
      preHandler: [authenticateToken, requireEditorAccess]
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const { name } = request.body;

        if (!name || name.trim().length === 0) {
          reply.code(400);
          return { error: 'Category name is required' };
        }

        // Check if category with this name already exists in the library
        const existingCategory = await prisma.userFileCategory.findFirst({
          where: {
            libraryId,
            name: name.trim(),
          },
        });

        if (existingCategory) {
          reply.code(409);
          return { error: 'Category with this name already exists' };
        }

        // Create the category
        const category = await prisma.userFileCategory.create({
          data: {
            libraryId,
            name: name.trim(),
          },
        });

        reply.code(201);
        return {
          message: 'File category created successfully',
          category,
        };
      } catch (error) {
        request.log.error({ error }, 'Create file category error');
        reply.code(500);
        return {
          error: 'Failed to create file category',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Get all file categories in a library
  fastify.get<{ Params: { libraryId: string } }>(
    '/:libraryId/file-categories',
    {
      schema: getLibraryFileCategoriesSchema,
      preHandler: [authenticateToken, requireViewerAccess]
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);

        const categories = await prisma.userFileCategory.findMany({
          where: { libraryId },
          include: {
            _count: {
              select: { userFiles: true },
            },
          },
          orderBy: {
            name: 'asc',
          },
        });

        // Transform the response to include fileCount
        const categoriesWithCount = categories.map((category) => ({
          id: category.id,
          name: category.name,
          libraryId: category.libraryId,
          fileCount: category._count.userFiles,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        }));

        return { categories: categoriesWithCount };
      } catch (error) {
        request.log.error({ error }, 'Get file categories error');
        reply.code(500);
        return {
          error: 'Failed to fetch file categories',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Get single file category with its files
  fastify.get<{ Params: { libraryId: string; categoryId: string } }>(
    '/:libraryId/file-categories/:categoryId',
    {
      schema: getUserFileCategorySchema,
      preHandler: [authenticateToken, requireViewerAccess]
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const categoryId = parseInt(request.params.categoryId, 10);

        const category = await prisma.userFileCategory.findFirst({
          where: {
            id: categoryId,
            libraryId,
          },
          include: {
            userFiles: {
              select: {
                id: true,
                fileName: true,
                fileType: true,
                fileSize: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        });

        if (!category) {
          reply.code(404);
          return { error: 'Category not found' };
        }

        return { category };
      } catch (error) {
        request.log.error({ error }, 'Get file category error');
        reply.code(500);
        return {
          error: 'Failed to fetch file category',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Update file category
  fastify.put<{
    Params: { libraryId: string; categoryId: string };
    Body: {
      name?: string;
    };
  }>(
    '/:libraryId/file-categories/:categoryId',
    {
      schema: updateUserFileCategorySchema,
      preHandler: [authenticateToken, requireEditorAccess]
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const categoryId = parseInt(request.params.categoryId, 10);
        const { name } = request.body;

        // Verify category exists in this library
        const existingCategory = await prisma.userFileCategory.findFirst({
          where: { id: categoryId, libraryId },
        });

        if (!existingCategory) {
          reply.code(404);
          return { error: 'Category not found' };
        }

        // If updating name, check for duplicates
        if (name && name.trim() !== existingCategory.name) {
          const duplicateCategory = await prisma.userFileCategory.findFirst({
            where: {
              libraryId,
              name: name.trim(),
              id: { not: categoryId },
            },
          });

          if (duplicateCategory) {
            reply.code(409);
            return { error: 'Category with this name already exists' };
          }
        }

        // Update the category
        const category = await prisma.userFileCategory.update({
          where: { id: categoryId },
          data: {
            ...(name && { name: name.trim() }),
          },
        });

        return {
          message: 'Category updated successfully',
          category,
        };
      } catch (error) {
        request.log.error({ error }, 'Update file category error');
        reply.code(500);
        return {
          error: 'Failed to update file category',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Delete file category
  fastify.delete<{ Params: { libraryId: string; categoryId: string } }>(
    '/:libraryId/file-categories/:categoryId',
    {
      schema: deleteUserFileCategorySchema,
      preHandler: [authenticateToken, requireEditorAccess]
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const categoryId = parseInt(request.params.categoryId, 10);

        // Verify category exists in this library
        const category = await prisma.userFileCategory.findFirst({
          where: { id: categoryId, libraryId },
        });

        if (!category) {
          reply.code(404);
          return { error: 'Category not found' };
        }

        // Delete the category (files will have categoryId set to null due to onDelete: SetNull)
        await prisma.userFileCategory.delete({
          where: { id: categoryId },
        });

        reply.code(204);
        return;
      } catch (error) {
        request.log.error({ error }, 'Delete file category error');
        reply.code(500);
        return {
          error: 'Failed to delete file category',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );
};

