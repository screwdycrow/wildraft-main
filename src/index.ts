import Fastify from 'fastify';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';
import { registerRoutes } from './routes';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Initialize Fastify
const fastify = Fastify({
  logger: true,
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
  } catch (err) {
    fastify.log.error(err);
    await prisma.$disconnect();
    process.exit(1);
  }
};

start();

