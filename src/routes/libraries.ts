import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireViewerAccess, requireEditorAccess, requireOwnerAccess } from '../middleware/library-access';
import { AccessRole } from '@prisma/client';
import {
  getLibrariesSchema,
  createLibrarySchema,
  getLibrarySchema,
  updateLibrarySchema,
  deleteLibrarySchema,
} from '../schemas/library.schemas';

export const libraryRoutes = async (fastify: FastifyInstance) => {
  // Get all libraries accessible by the current user with their roles
  fastify.get(
    '/',
    { schema: getLibrariesSchema, preHandler: authenticateToken },
    async (request, reply) => {
      try {
        if (!request.user) {
          reply.code(401);
          return { error: 'Unauthorized' };
        }

        // Get all libraries the user has access to
        const librariesWithAccess = await prisma.libraryAccess.findMany({
          where: {
            userId: request.user.userId,
          },
          include: {
            library: true,
          },
          orderBy: {
            library: {
              createdAt: 'desc',
            },
          },
        });

        // Transform the response to include role information
        const libraries = librariesWithAccess.map((access) => ({
          id: access.library.id,
          name: access.library.name,
          description: access.library.description,
          role: access.role,
          createdAt: access.library.createdAt,
          updatedAt: access.library.updatedAt,
        }));

        return { libraries };
      } catch (error) {
        request.log.error({ error }, 'Failed to fetch libraries');
        reply.code(500);
        return {
          error: 'Failed to fetch libraries',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Get a specific library by ID
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    { schema: getLibrarySchema, preHandler: [authenticateToken, requireViewerAccess] },
    async (request, reply) => {
      try {
        const id = parseInt(request.params.id, 10);

        if (isNaN(id)) {
          reply.code(400);
          return { error: 'Invalid library ID' };
        }

        const library = await prisma.library.findUnique({
          where: { id },
          include: {
            access: {
              select: {
                id: true,
                userId: true,
                role: true,
                user: {
                  select: {
                    id: true,
                    email: true,
                    name: true,
                    picture: true,
                  },
                },
              },
            },
          },
        });

        if (!library) {
          reply.code(404);
          return { error: 'Library not found' };
        }

        return {
          library: {
            ...library,
            userRole: request.libraryAccess?.role,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to fetch library');
        reply.code(500);
        return {
          error: 'Failed to fetch library',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Create a new library
  fastify.post<{ Body: { name: string; description?: string } }>(
    '/',
    { schema: createLibrarySchema, preHandler: authenticateToken },
    async (request, reply) => {
      try {
        if (!request.user) {
          reply.code(401);
          return { error: 'Unauthorized' };
        }

        const { name, description } = request.body;

        if (!name || name.trim() === '') {
          reply.code(400);
          return { error: 'Library name is required' };
        }

        // Create library and grant owner access to creator
        const library = await prisma.library.create({
          data: {
            name: name.trim(),
            description: description?.trim() || null,
            access: {
              create: {
                userId: request.user.userId,
                role: AccessRole.OWNER,
              },
            },
          },
          include: {
            access: {
              where: {
                userId: request.user.userId,
              },
              select: {
                role: true,
              },
            },
          },
        });

        reply.code(201);
        return {
          message: 'Library created successfully',
          library: {
            ...library,
            userRole: library.access[0]?.role,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to create library');
        reply.code(500);
        return {
          error: 'Failed to create library',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Update a library
  fastify.put<{ Params: { id: string }; Body: { name?: string; description?: string } }>(
    '/:id',
    { schema: updateLibrarySchema, preHandler: [authenticateToken, requireEditorAccess] },
    async (request, reply) => {
      try {
        const id = parseInt(request.params.id, 10);

        if (isNaN(id)) {
          reply.code(400);
          return { error: 'Invalid library ID' };
        }

        const { name, description } = request.body;

        // Validate at least one field is provided
        if (name === undefined && description === undefined) {
          reply.code(400);
          return { error: 'At least one field (name or description) must be provided' };
        }

        // Validate name if provided
        if (name !== undefined && name.trim() === '') {
          reply.code(400);
          return { error: 'Library name cannot be empty' };
        }

        const library = await prisma.library.update({
          where: { id },
          data: {
            ...(name !== undefined && { name: name.trim() }),
            ...(description !== undefined && { description: description.trim() || null }),
          },
        });

        return {
          message: 'Library updated successfully',
          library: {
            ...library,
            userRole: request.libraryAccess?.role,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to update library');
        reply.code(500);
        return {
          error: 'Failed to update library',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Delete a library (only owners can delete)
  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    { schema: deleteLibrarySchema, preHandler: [authenticateToken, requireOwnerAccess] },
    async (request, reply) => {
      try {
        const id = parseInt(request.params.id, 10);

        if (isNaN(id)) {
          reply.code(400);
          return { error: 'Invalid library ID' };
        }

        // Delete library (cascade will delete all access records)
        await prisma.library.delete({
          where: { id },
        });

        reply.code(204);
        return;
      } catch (error) {
        request.log.error({ error }, 'Failed to delete library');
        reply.code(500);
        return {
          error: 'Failed to delete library',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );
};

