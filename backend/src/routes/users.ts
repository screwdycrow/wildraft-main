import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { hashPassword, comparePassword, validatePassword } from '../lib/password';
import { updateProfileSchema, changePasswordSchema } from '../schemas/user.schemas';

export const userRoutes = async (fastify: FastifyInstance) => {
  // Update current user profile
  fastify.put<{ Body: { name?: string; email?: string; openaiApiKey?: string; aiSettings?: any } }>(
    '/me',
    { schema: updateProfileSchema, preHandler: authenticateToken },
    async (request, reply) => {
      try {
        if (!request.user) {
          reply.code(401);
          return { error: 'Unauthorized' };
        }

        const { name, email, openaiApiKey, aiSettings } = request.body;

        // At least one field must be provided
        if (name === undefined && email === undefined && openaiApiKey === undefined && aiSettings === undefined) {
          reply.code(400);
          return { error: 'At least one field to update must be provided' };
        }

        // If email is being changed, validate format and check if it's already taken
        if (email) {
          const existingUser = await prisma.user.findUnique({
            where: { email },
          });

          if (existingUser && existingUser.id !== request.user.userId) {
            reply.code(409);
            return { error: 'Email already in use' };
          }
        }

        // Update user
        const updatedUser = await prisma.user.update({
          where: { id: request.user.userId },
          data: {
            ...(name !== undefined && { name }),
            ...(email !== undefined && { email }),
            ...(openaiApiKey !== undefined && { openaiApiKey }),
            ...(aiSettings !== undefined && { aiSettings }),
          },
          select: {
            id: true,
            email: true,
            name: true,
            picture: true,
            updatedAt: true,
            aiSettings: true, // Return non-sensitive settings
            // openaiApiKey is intentionally excluded
          },
        });

        return {
          message: 'Profile updated successfully',
          user: updatedUser,
        };
      } catch (error) {
        console.error('Update profile error:', error);
        reply.code(500);
        return {
          error: 'Failed to update profile',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Change password
  fastify.put<{ Body: { currentPassword: string; newPassword: string } }>(
    '/me/password',
    { schema: changePasswordSchema, preHandler: authenticateToken },
    async (request, reply) => {
      try {
        if (!request.user) {
          reply.code(401);
          return { error: 'Unauthorized' };
        }

        const { currentPassword, newPassword } = request.body;

        // Validate input
        if (!currentPassword || !newPassword) {
          reply.code(400);
          return { error: 'Current password and new password are required' };
        }

        // Validate new password strength
        const passwordError = validatePassword(newPassword);
        if (passwordError) {
          reply.code(400);
          return { error: passwordError };
        }

        // Get user with password
        const user = await prisma.user.findUnique({
          where: { id: request.user.userId },
        });

        if (!user) {
          reply.code(404);
          return { error: 'User not found' };
        }

        // Check if user has a password (might be OAuth-only user)
        if (!user.password) {
          reply.code(400);
          return { error: 'Cannot change password for OAuth-only accounts' };
        }

        // Verify current password
        const isValidPassword = await comparePassword(currentPassword, user.password);
        if (!isValidPassword) {
          reply.code(401);
          return { error: 'Current password is incorrect' };
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update password
        await prisma.user.update({
          where: { id: request.user.userId },
          data: { password: hashedPassword },
        });

        return {
          message: 'Password changed successfully',
        };
      } catch (error) {
        console.error('Change password error:', error);
        reply.code(500);
        return {
          error: 'Failed to change password',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );
};
