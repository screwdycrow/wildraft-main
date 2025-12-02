import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../lib/jwt';
import { prisma } from '../lib/prisma';
import { userExistsCache } from '../lib/cache';

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: number;
      email: string;
    };
  }
}

/**
 * Authentication middleware to protect routes
 * Uses cache to avoid DB query on every request
 */
export const authenticateToken = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      reply.code(401).send({
        error: 'Unauthorized',
        message: 'No authorization header provided',
      });
      return;
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      reply.code(401).send({
        error: 'Unauthorized',
        message: 'No token provided',
      });
      return;
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Check cache first for user existence
    const cachedExists = userExistsCache.get(decoded.userId);
    
    if (cachedExists === undefined) {
      // Cache miss - query database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true }, // Only need to check existence
      });

      if (!user) {
        reply.code(401).send({
          error: 'Unauthorized',
          message: 'User not found',
        });
        return;
      }

      // Cache the result
      userExistsCache.set(decoded.userId, true);
    }

    // Attach user to request
    request.user = {
      userId: decoded.userId,
      email: decoded.email,
    };
  } catch (error) {
    reply.code(401).send({
      error: 'Unauthorized',
      message: error instanceof Error ? error.message : 'Invalid token',
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token is provided
 * Uses cache to avoid DB query on every request
 */
export const optionalAuth = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return; // No token, but that's okay
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      return;
    }

    const decoded = verifyAccessToken(token);

    // Check cache first for user existence
    const cachedExists = userExistsCache.get(decoded.userId);
    
    if (cachedExists === undefined) {
      // Cache miss - query database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true },
      });

      if (user) {
        userExistsCache.set(decoded.userId, true);
        request.user = {
          userId: decoded.userId,
          email: decoded.email,
        };
      }
    } else {
      // Cache hit
      request.user = {
        userId: decoded.userId,
        email: decoded.email,
      };
    }
  } catch (error) {
    // Ignore errors for optional auth
    request.log.debug('Optional auth failed:', error);
  }
};










