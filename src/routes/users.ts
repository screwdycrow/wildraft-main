import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';

export const userRoutes = async (fastify: FastifyInstance) => {
  // Get all users
  fastify.get('/', async (request, reply) => {
    try {
      const users = await prisma.user.findMany();
      return { users };
    } catch (error) {
      reply.code(500);
      return {
        error: 'Failed to fetch users',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get user by ID
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const id = parseInt(request.params.id, 10);
      
      if (isNaN(id)) {
        reply.code(400);
        return { error: 'Invalid user ID' };
      }

      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        reply.code(404);
        return { error: 'User not found' };
      }

      return { user };
    } catch (error) {
      reply.code(500);
      return {
        error: 'Failed to fetch user',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Create user
  fastify.post<{ Body: { email: string; name?: string } }>(
    '/',
    async (request, reply) => {
      try {
        const { email, name } = request.body;

        if (!email) {
          reply.code(400);
          return { error: 'Email is required' };
        }

        const user = await prisma.user.create({
          data: {
            email,
            name,
          },
        });

        reply.code(201);
        return { user };
      } catch (error) {
        reply.code(500);
        return {
          error: 'Failed to create user',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Update user
  fastify.put<{ Params: { id: string }; Body: { email?: string; name?: string } }>(
    '/:id',
    async (request, reply) => {
      try {
        const id = parseInt(request.params.id, 10);
        
        if (isNaN(id)) {
          reply.code(400);
          return { error: 'Invalid user ID' };
        }

        const { email, name } = request.body;

        const user = await prisma.user.update({
          where: { id },
          data: {
            ...(email && { email }),
            ...(name && { name }),
          },
        });

        return { user };
      } catch (error) {
        reply.code(500);
        return {
          error: 'Failed to update user',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Delete user
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const id = parseInt(request.params.id, 10);
      
      if (isNaN(id)) {
        reply.code(400);
        return { error: 'Invalid user ID' };
      }

      await prisma.user.delete({
        where: { id },
      });

      reply.code(204);
      return;
    } catch (error) {
      reply.code(500);
      return {
        error: 'Failed to delete user',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};

