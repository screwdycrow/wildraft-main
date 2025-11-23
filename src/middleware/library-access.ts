import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { AccessRole } from '@prisma/client';
import { hasPermission } from '../lib/library-permissions';

// Extend FastifyRequest to include library access info
declare module 'fastify' {
  interface FastifyRequest {
    libraryAccess?: {
      libraryId: number;
      role: AccessRole;
    };
  }
}

/**
 * Middleware to check if user has access to a library
 * Attaches library access info to request
 */
export const checkLibraryAccess = (requiredRole: AccessRole) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Check if user is authenticated
      if (!request.user) {
        reply.code(401);
        return reply.send({ error: 'Unauthorized', message: 'User not authenticated' });
      }

      // Get library ID from params
      const libraryId = parseInt((request.params as any).libraryId || (request.params as any).id, 10);

      if (isNaN(libraryId)) {
        reply.code(400);
        return reply.send({ error: 'Invalid library ID' });
      }

      // Check user's access to this library
      const access = await prisma.libraryAccess.findUnique({
        where: {
          userId_libraryId: {
            userId: request.user.userId,
            libraryId: libraryId,
          },
        },
      });

      if (!access) {
        reply.code(403);
        return reply.send({ 
          error: 'Access denied', 
          message: 'You do not have access to this library' 
        });
      }

      // Check if user has required permission level
      if (!hasPermission(access.role, requiredRole)) {
        reply.code(403);
        return reply.send({ 
          error: 'Insufficient permissions', 
          message: `This operation requires ${requiredRole} role or higher` 
        });
      }

      // Attach library access info to request
      request.libraryAccess = {
        libraryId: libraryId,
        role: access.role,
      };
    } catch (error) {
      request.log.error({ error }, 'Library access check failed');
      reply.code(500);
      return reply.send({ error: 'Failed to verify library access' });
    }
  };
};

/**
 * Middleware specifically for viewer access (read-only)
 */
export const requireViewerAccess = checkLibraryAccess(AccessRole.VIEWER);

/**
 * Middleware specifically for editor access
 */
export const requireEditorAccess = checkLibraryAccess(AccessRole.EDITOR);

/**
 * Middleware specifically for owner access
 */
export const requireOwnerAccess = checkLibraryAccess(AccessRole.OWNER);










