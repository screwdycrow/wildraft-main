import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireViewerAccess } from '../middleware/library-access';
import { AccessRole } from '@prisma/client';
import { canManageRole, canGrantRole, canChangeRole } from '../lib/library-permissions';
import {
  getLibraryAccessSchema,
  grantLibraryAccessSchema,
  updateLibraryAccessSchema,
  revokeLibraryAccessSchema,
  leaveLibrarySchema,
} from '../schemas/library-access.schemas';

export const libraryAccessRoutes = async (fastify: FastifyInstance) => {
  // Get all users with access to a library
  fastify.get<{ Params: { libraryId: string } }>(
    '/:libraryId/access',
    { schema: getLibraryAccessSchema, preHandler: [authenticateToken, requireViewerAccess] },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);

        if (isNaN(libraryId)) {
          reply.code(400);
          return { error: 'Invalid library ID' };
        }

        const accessList = await prisma.libraryAccess.findMany({
          where: {
            libraryId,
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                picture: true,
              },
            },
          },
          orderBy: [
            { role: 'desc' }, // OWNER first, then EDITOR, then VIEWER
            { createdAt: 'asc' },
          ],
        });

        return {
          access: accessList.map((access) => ({
            id: access.id,
            user: access.user,
            role: access.role,
            createdAt: access.createdAt,
            updatedAt: access.updatedAt,
          })),
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to fetch library access');
        reply.code(500);
        return {
          error: 'Failed to fetch library access',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Grant access to a user
  fastify.post<{
    Params: { libraryId: string };
    Body: { email: string; role: AccessRole };
  }>(
    '/:libraryId/access',
    { schema: grantLibraryAccessSchema, preHandler: [authenticateToken, requireViewerAccess] },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);

        if (isNaN(libraryId)) {
          reply.code(400);
          return { error: 'Invalid library ID' };
        }

        const { email, role } = request.body;

        if (!email || !role) {
          reply.code(400);
          return { error: 'Email and role are required' };
        }

        // Validate role
        if (!Object.values(AccessRole).includes(role)) {
          reply.code(400);
          return { error: 'Invalid role. Must be OWNER, EDITOR, or VIEWER' };
        }

        // Check if current user has permission to grant this role
        const currentUserRole = request.libraryAccess?.role;
        if (!currentUserRole) {
          reply.code(403);
          return { error: 'Access denied' };
        }

        if (!canGrantRole(currentUserRole, role)) {
          reply.code(403);
          return {
            error: 'Insufficient permissions',
            message: `You cannot grant ${role} role with your current ${currentUserRole} role`,
          };
        }

        // Find the user to grant access to
        const targetUser = await prisma.user.findUnique({
          where: { email },
        });

        if (!targetUser) {
          reply.code(404);
          return { error: 'User not found with this email' };
        }

        // Check if user already has access
        const existingAccess = await prisma.libraryAccess.findUnique({
          where: {
            userId_libraryId: {
              userId: targetUser.id,
              libraryId,
            },
          },
        });

        if (existingAccess) {
          reply.code(409);
          return {
            error: 'User already has access to this library',
            message: `User has ${existingAccess.role} role`,
          };
        }

        // Grant access
        const newAccess = await prisma.libraryAccess.create({
          data: {
            userId: targetUser.id,
            libraryId,
            role,
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                picture: true,
              },
            },
          },
        });

        reply.code(201);
        return {
          message: 'Access granted successfully',
          access: {
            id: newAccess.id,
            user: newAccess.user,
            role: newAccess.role,
            createdAt: newAccess.createdAt,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to grant access');
        reply.code(500);
        return {
          error: 'Failed to grant access',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Update user's access level
  fastify.put<{
    Params: { libraryId: string; accessId: string };
    Body: { role: AccessRole };
  }>(
    '/:libraryId/access/:accessId',
    { schema: updateLibraryAccessSchema, preHandler: [authenticateToken, requireViewerAccess] },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const accessId = parseInt(request.params.accessId, 10);

        if (isNaN(libraryId) || isNaN(accessId)) {
          reply.code(400);
          return { error: 'Invalid library ID or access ID' };
        }

        const { role } = request.body;

        if (!role) {
          reply.code(400);
          return { error: 'Role is required' };
        }

        // Validate role
        if (!Object.values(AccessRole).includes(role)) {
          reply.code(400);
          return { error: 'Invalid role. Must be OWNER, EDITOR, or VIEWER' };
        }

        // Get current user's role
        const currentUserRole = request.libraryAccess?.role;
        if (!currentUserRole) {
          reply.code(403);
          return { error: 'Access denied' };
        }

        // Get the access record to update
        const existingAccess = await prisma.libraryAccess.findUnique({
          where: { id: accessId },
        });

        if (!existingAccess || existingAccess.libraryId !== libraryId) {
          reply.code(404);
          return { error: 'Access record not found' };
        }

        // Prevent users from modifying their own access
        if (existingAccess.userId === request.user?.userId) {
          reply.code(403);
          return { error: 'You cannot modify your own access level' };
        }

        // Check if user has permission to change this role
        if (!canChangeRole(currentUserRole, existingAccess.role, role)) {
          reply.code(403);
          return {
            error: 'Insufficient permissions',
            message: `You cannot change ${existingAccess.role} to ${role} with your current ${currentUserRole} role`,
          };
        }

        // Check that at least one OWNER remains
        if (existingAccess.role === AccessRole.OWNER && role !== AccessRole.OWNER) {
          const ownerCount = await prisma.libraryAccess.count({
            where: {
              libraryId,
              role: AccessRole.OWNER,
            },
          });

          if (ownerCount <= 1) {
            reply.code(400);
            return {
              error: 'Cannot remove last owner',
              message: 'A library must have at least one owner',
            };
          }
        }

        // Update access
        const updatedAccess = await prisma.libraryAccess.update({
          where: { id: accessId },
          data: { role },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                picture: true,
              },
            },
          },
        });

        return {
          message: 'Access updated successfully',
          access: {
            id: updatedAccess.id,
            user: updatedAccess.user,
            role: updatedAccess.role,
            updatedAt: updatedAccess.updatedAt,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to update access');
        reply.code(500);
        return {
          error: 'Failed to update access',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Remove user's access
  fastify.delete<{ Params: { libraryId: string; accessId: string } }>(
    '/:libraryId/access/:accessId',
    { schema: revokeLibraryAccessSchema, preHandler: [authenticateToken, requireViewerAccess] },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const accessId = parseInt(request.params.accessId, 10);

        if (isNaN(libraryId) || isNaN(accessId)) {
          reply.code(400);
          return { error: 'Invalid library ID or access ID' };
        }

        // Get current user's role
        const currentUserRole = request.libraryAccess?.role;
        if (!currentUserRole) {
          reply.code(403);
          return { error: 'Access denied' };
        }

        // Get the access record to delete
        const existingAccess = await prisma.libraryAccess.findUnique({
          where: { id: accessId },
        });

        if (!existingAccess || existingAccess.libraryId !== libraryId) {
          reply.code(404);
          return { error: 'Access record not found' };
        }

        // Prevent users from removing their own access
        if (existingAccess.userId === request.user?.userId) {
          reply.code(403);
          return { error: 'You cannot remove your own access' };
        }

        // Check if user has permission to remove this access
        if (!canManageRole(currentUserRole, existingAccess.role)) {
          reply.code(403);
          return {
            error: 'Insufficient permissions',
            message: `You cannot remove ${existingAccess.role} access with your current ${currentUserRole} role`,
          };
        }

        // Check that at least one OWNER remains
        if (existingAccess.role === AccessRole.OWNER) {
          const ownerCount = await prisma.libraryAccess.count({
            where: {
              libraryId,
              role: AccessRole.OWNER,
            },
          });

          if (ownerCount <= 1) {
            reply.code(400);
            return {
              error: 'Cannot remove last owner',
              message: 'A library must have at least one owner',
            };
          }
        }

        // Delete access
        await prisma.libraryAccess.delete({
          where: { id: accessId },
        });

        reply.code(204);
        return;
      } catch (error) {
        request.log.error({ error }, 'Failed to remove access');
        reply.code(500);
        return {
          error: 'Failed to remove access',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Leave library (remove own access)
  fastify.post<{ Params: { libraryId: string } }>(
    '/:libraryId/leave',
    { schema: leaveLibrarySchema, preHandler: [authenticateToken, requireViewerAccess] },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);

        if (isNaN(libraryId)) {
          reply.code(400);
          return { error: 'Invalid library ID' };
        }

        if (!request.user) {
          reply.code(401);
          return { error: 'Unauthorized' };
        }

        // Get user's access
        const userAccess = await prisma.libraryAccess.findUnique({
          where: {
            userId_libraryId: {
              userId: request.user.userId,
              libraryId,
            },
          },
        });

        if (!userAccess) {
          reply.code(404);
          return { error: 'You do not have access to this library' };
        }

        // Check if user is the last owner
        if (userAccess.role === AccessRole.OWNER) {
          const ownerCount = await prisma.libraryAccess.count({
            where: {
              libraryId,
              role: AccessRole.OWNER,
            },
          });

          if (ownerCount <= 1) {
            reply.code(400);
            return {
              error: 'Cannot leave library',
              message: 'You are the last owner. Transfer ownership or delete the library instead.',
            };
          }
        }

        // Remove access
        await prisma.libraryAccess.delete({
          where: { id: userAccess.id },
        });

        return { message: 'Successfully left the library' };
      } catch (error) {
        request.log.error({ error }, 'Failed to leave library');
        reply.code(500);
        return {
          error: 'Failed to leave library',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );
};

