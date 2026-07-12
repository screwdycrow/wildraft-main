// Load environment variables FIRST - before any other imports
// This ensures env vars are available when modules like s3.ts and prisma.ts are loaded
import dotenv from 'dotenv';
dotenv.config();

import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import fastifySocketIO from 'fastify-socket.io';
import { prisma } from './lib/prisma';
import { registerRoutes } from './routes';
import { registerPortalViewSocket } from './websocket/portal-view-socket';
import { registerDmScreenSocket } from './websocket/dm-screen-socket';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Initialize Fastify
const fastify = Fastify({
  logger: true,
  // Railway terminates TLS at the edge; Socket.IO needs correct client IPs / proto
  trustProxy: process.env.NODE_ENV === 'production',
  // Increase body limit for file uploads (base64 encoded files are ~33% larger)
  // 50MB should handle most use cases
  bodyLimit: 50 * 1024 * 1024, // 50MB
  ajv: {
    customOptions: {
      removeAdditional: false, // Don't strip additional properties - allow flexible JSON in data fields
      coerceTypes: true,
      useDefaults: true,
      // Allow OpenAPI keywords
      strictSchema: false,
    },
  },
});

// Register CORS
// CORS_ORIGINS = comma-separated browser origins (frontend Railway URL, custom domain, etc.)
// FRONTEND_URL = shorthand for a single production frontend origin
const allowedOrigins = [
  ...new Set(
    [
      'http://localhost:3000',
      'http://localhost:5173',
      process.env.FRONTEND_URL?.trim(),
      ...(process.env.CORS_ORIGINS || '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    ].filter(Boolean) as string[]
  ),
];

const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true; // curl, Socket.IO polling without Origin, etc.
  if (allowedOrigins.includes(origin)) return true;
  // Allow www / non-www variant when one is configured
  try {
    const url = new URL(origin);
    const alt = `${url.protocol}//${url.hostname.startsWith('www.') ? url.hostname.slice(4) : `www.${url.hostname}`}${url.port ? `:${url.port}` : ''}`;
    return allowedOrigins.includes(alt);
  } catch {
    return false;
  }
};

fastify.register(cors, {
  origin: (origin, cb) => {
    if (isOriginAllowed(origin)) return cb(null, true);
    fastify.log.warn({ origin, allowedOrigins }, 'CORS: Origin not allowed');
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
      { name: 'library-items', description: 'Library item endpoints (stat blocks, notes, items, characters)' },
      { name: 'tags', description: 'Tag management endpoints' },
      { name: 'tag-folders', description: 'Tag folder management endpoints for organizing tags' },
      { name: 'combat-encounters', description: 'Combat encounter management endpoints' },
      { name: 'portal-views', description: 'Portal view management endpoints for player-facing displays' },
      { name: 'dm-screens', description: 'DM screen management endpoints for organizing and displaying content for the Dungeon Master' },
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

// Register Socket.IO (same CORS rules as REST — required for browser clients on Railway)
fastify.register(fastifySocketIO, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) return callback(null, true);
      callback(new Error('CORS: Origin not allowed'), false);
    },
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Socket.IO setup must happen after fastify.ready()
fastify.ready().then(() => {
  registerPortalViewSocket(fastify);
  registerDmScreenSocket(fastify);
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
    fastify.log.info(`WebSocket endpoint available at: ws://${HOST}:${PORT}/ws/portal-view/:portalViewId`);
  } catch (err) {
    fastify.log.error(err);
    await prisma.$disconnect();
    process.exit(1);
  }
};

start();

// Export fastify instance for testing/scripts
export { fastify };

