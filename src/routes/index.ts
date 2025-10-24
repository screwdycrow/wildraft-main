import { FastifyInstance } from 'fastify';
import { healthRoutes } from './health';
import { userRoutes } from './users';

export const registerRoutes = (fastify: FastifyInstance) => {
  // Health check routes
  fastify.register(healthRoutes, { prefix: '/health' });
  
  // API routes
  fastify.register(userRoutes, { prefix: '/api/users' });
};

