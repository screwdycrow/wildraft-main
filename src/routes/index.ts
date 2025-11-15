import { FastifyInstance } from 'fastify';
import { healthRoutes } from './health';
import { userRoutes } from './users';
import { authRoutes } from './auth';
import { libraryRoutes } from './libraries';
import { libraryAccessRoutes } from './library-access';
import { libraryItemRoutes } from './library-items';
import { tagRoutes } from './tags';
import { userFileRoutes } from './user-files';
import { combatEncounterRoutes } from './combat-encounters';
import { portalViewRoutes } from './portal-views';
import { versionRoutes } from './versions';

export const registerRoutes = (fastify: FastifyInstance) => {
  // Health check routes
  fastify.register(healthRoutes, { prefix: '/health' });
  
  // API routes
  fastify.register(userRoutes, { prefix: '/api/users' });
  
  // Authentication routes
  fastify.register(authRoutes, { prefix: '/api/auth' });
  
  // Library routes
  fastify.register(libraryRoutes, { prefix: '/api/libraries' });
  
  // Library access management routes
  fastify.register(libraryAccessRoutes, { prefix: '/api/libraries' });
  
  // Library item routes
  fastify.register(libraryItemRoutes, { prefix: '/api/libraries' });
  
  // Tag routes
  fastify.register(tagRoutes, { prefix: '/api/libraries' });
  
  // Combat encounter routes
  fastify.register(combatEncounterRoutes, { prefix: '/api/libraries' });
  
  // Portal view routes
  fastify.register(portalViewRoutes, { prefix: '/api/libraries' });
  
  // User file routes
  fastify.register(userFileRoutes, { prefix: '/api/files' });
  
  // Version routes
  fastify.register(versionRoutes, { prefix: '/api' });
};

