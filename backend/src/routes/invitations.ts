import { FastifyInstance } from 'fastify';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireEditorAccess } from '../middleware/library-access';
import { AccessRole, PlayerInvitation } from '@prisma/client';
import { canGrantRole, PERMISSION_LEVELS as ROLE_LEVELS } from '../lib/library-permissions';
import { invalidateLibraryAccess } from '../lib/cache';
import {
  createInvitationSchema,
  listInvitationsSchema,
  revokeInvitationSchema,
  getInvitationByTokenSchema,
  claimInvitationSchema,
} from '../schemas/invitations.schemas';

type InvitationStatus = 'valid' | 'expired' | 'revoked' | 'exhausted';

const getInvitationStatus = (invitation: PlayerInvitation): InvitationStatus => {
  if (invitation.revokedAt) return 'revoked';
  if (invitation.expiresAt && invitation.expiresAt < new Date()) return 'expired';
  if (invitation.maxUses !== null && invitation.uses >= invitation.maxUses) return 'exhausted';
  return 'valid';
};

const serializeInvitation = (invitation: PlayerInvitation) => ({
  id: invitation.id,
  token: invitation.token,
  role: invitation.role,
  email: invitation.email,
  expiresAt: invitation.expiresAt,
  maxUses: invitation.maxUses,
  uses: invitation.uses,
  revokedAt: invitation.revokedAt,
  usedAt: invitation.usedAt,
  createdAt: invitation.createdAt,
});

/**
 * Library-scoped invitation management (create / list / revoke).
 * Registered under the /api/libraries prefix.
 */
export const libraryInvitationRoutes = async (fastify: FastifyInstance) => {
  // Create an invite link
  fastify.post<{
    Params: { libraryId: string };
    Body: { role?: AccessRole; email?: string; expiresAt?: string; maxUses?: number };
  }>(
    '/:libraryId/invitations',
    { schema: createInvitationSchema, preHandler: [authenticateToken, requireEditorAccess] },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const { role = AccessRole.PLAYER, email, expiresAt, maxUses } = request.body ?? {};

        const currentUserRole = request.libraryAccess!.role;
        if (!canGrantRole(currentUserRole, role)) {
          reply.code(403);
          return {
            error: 'Insufficient permissions',
            message: `You cannot create ${role} invitations with your current ${currentUserRole} role`,
          };
        }

        const invitation = await prisma.playerInvitation.create({
          data: {
            token: crypto.randomBytes(24).toString('base64url'),
            libraryId,
            role,
            email: email?.toLowerCase().trim() || null,
            createdById: request.user!.userId,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            maxUses: maxUses ?? null,
          },
        });

        reply.code(201);
        return { invitation: serializeInvitation(invitation) };
      } catch (error) {
        request.log.error({ error }, 'Failed to create invitation');
        reply.code(500);
        return {
          error: 'Failed to create invitation',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // List invitations for a library
  fastify.get<{ Params: { libraryId: string } }>(
    '/:libraryId/invitations',
    { schema: listInvitationsSchema, preHandler: [authenticateToken, requireEditorAccess] },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const invitations = await prisma.playerInvitation.findMany({
          where: { libraryId },
          orderBy: { createdAt: 'desc' },
        });
        return { invitations: invitations.map(serializeInvitation) };
      } catch (error) {
        request.log.error({ error }, 'Failed to list invitations');
        reply.code(500);
        return {
          error: 'Failed to list invitations',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Revoke an invitation (soft: keeps the row for auditing)
  fastify.delete<{ Params: { libraryId: string; invitationId: string } }>(
    '/:libraryId/invitations/:invitationId',
    { schema: revokeInvitationSchema, preHandler: [authenticateToken, requireEditorAccess] },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const { invitationId } = request.params;

        const invitation = await prisma.playerInvitation.findFirst({
          where: { id: invitationId, libraryId },
        });
        if (!invitation) {
          reply.code(404);
          return { error: 'Invitation not found' };
        }

        await prisma.playerInvitation.update({
          where: { id: invitationId },
          data: { revokedAt: new Date() },
        });

        reply.code(204);
        return;
      } catch (error) {
        request.log.error({ error }, 'Failed to revoke invitation');
        reply.code(500);
        return {
          error: 'Failed to revoke invitation',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );
};

/**
 * Public/claim invitation routes.
 * Registered under the /api/invitations prefix.
 */
export const invitationRoutes = async (fastify: FastifyInstance) => {
  // Inspect an invite link — used by the landing page, no auth
  fastify.get<{ Params: { token: string } }>(
    '/:token',
    { schema: getInvitationByTokenSchema },
    async (request, reply) => {
      try {
        const invitation = await prisma.playerInvitation.findUnique({
          where: { token: request.params.token },
          include: { library: { select: { id: true, name: true } } },
        });
        if (!invitation) {
          reply.code(404);
          return { error: 'Invitation not found' };
        }

        return {
          library: invitation.library,
          role: invitation.role,
          email: invitation.email,
          status: getInvitationStatus(invitation),
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to fetch invitation');
        reply.code(500);
        return {
          error: 'Failed to fetch invitation',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Claim an invite link as the authenticated user
  fastify.post<{ Params: { token: string } }>(
    '/:token/claim',
    { schema: claimInvitationSchema, preHandler: [authenticateToken] },
    async (request, reply) => {
      try {
        const invitation = await prisma.playerInvitation.findUnique({
          where: { token: request.params.token },
        });
        if (!invitation) {
          reply.code(404);
          return { error: 'Invitation not found' };
        }

        const status = getInvitationStatus(invitation);
        if (status !== 'valid') {
          reply.code(400);
          return { error: 'Invitation is no longer valid', message: `This invitation is ${status}.` };
        }

        const userEmail = request.user!.email.toLowerCase();
        if (invitation.email && invitation.email !== userEmail) {
          reply.code(403);
          return {
            error: 'Invitation is restricted to another email',
            message: 'This invite link was created for a different email address.',
          };
        }

        const userId = request.user!.userId;

        const result = await prisma.$transaction(async (tx) => {
          const existing = await tx.libraryAccess.findUnique({
            where: { userId_libraryId: { userId, libraryId: invitation.libraryId } },
          });

          let role = invitation.role;
          let alreadyMember = false;

          if (existing) {
            alreadyMember = true;
            // Never downgrade an existing member; upgrade if the invite is higher.
            if (ROLE_LEVELS[invitation.role] > ROLE_LEVELS[existing.role]) {
              await tx.libraryAccess.update({
                where: { id: existing.id },
                data: { role: invitation.role },
              });
            } else {
              role = existing.role;
            }
          } else {
            await tx.libraryAccess.create({
              data: { userId, libraryId: invitation.libraryId, role: invitation.role },
            });
          }

          await tx.playerInvitation.update({
            where: { id: invitation.id },
            data: { uses: { increment: 1 }, usedAt: new Date(), usedById: userId },
          });

          return { role, alreadyMember };
        });

        invalidateLibraryAccess(userId, invitation.libraryId);

        return {
          libraryId: invitation.libraryId,
          role: result.role,
          alreadyMember: result.alreadyMember,
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to claim invitation');
        reply.code(500);
        return {
          error: 'Failed to claim invitation',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );
};
