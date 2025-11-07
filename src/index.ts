// Load environment variables FIRST - before any other imports
// This ensures env vars are available when modules like s3.ts and prisma.ts are loaded
import dotenv from 'dotenv';
dotenv.config();

import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { prisma } from './lib/prisma';
import { registerRoutes } from './routes';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Initialize Fastify
const fastify = Fastify({
  logger: true,
  ajv: {
    customOptions: {
      removeAdditional: 'all',
      coerceTypes: true,
      useDefaults: true,
      // Allow OpenAPI keywords
      strictSchema: false,
    },
  },
});

// Register CORS
// Supports multiple origins via CORS_ORIGINS (comma-separated). Falls back to common dev ports.
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

fastify.register(cors, {
  origin: (origin, cb) => {
    // Allow non-browser clients (curl, server-to-server) with no origin
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS: Origin not allowed'), false);
  },
  credentials: true,
});

// Register Swagger
fastify.register(swagger, {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'Wildraft Prisma Backend API',
      description: 'Backend API with authentication and library management',
      version: '1.0.0',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'health', description: 'Health check endpoints' },
      { name: 'auth', description: 'Authentication endpoints' },
      { name: 'users', description: 'User management endpoints' },
      { name: 'libraries', description: 'Library management endpoints' },
      { name: 'library-access', description: 'Library access control endpoints' },
      { name: 'files', description: 'File upload and management endpoints' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
});

// Register Swagger UI
fastify.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
});

// Register routes
registerRoutes(fastify);

// Graceful shutdown
const gracefulShutdown = async () => {
  fastify.log.info('Received shutdown signal...');
  
  await prisma.$disconnect();
  fastify.log.info('Database connection closed');
  
  await fastify.close();
  fastify.log.info('Server closed');
  
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`Server is running on http://${HOST}:${PORT}`);
    fastify.log.info(`API Documentation available at: http://${HOST}:${PORT}/docs`);
    fastify.log.info(`OpenAPI JSON available at: http://${HOST}:${PORT}/docs/json`);
  } catch (err) {
    fastify.log.error(err);
    await prisma.$disconnect();
    process.exit(1);
  }
};

start();

// Export fastify instance for testing/scripts
export { fastify };

