import fs from 'fs';
import path from 'path';
import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);

async function exportOpenAPI() {
  // Create a temporary Fastify instance
  const fastify = Fastify({
    logger: false,
  });

  // Register Swagger
  await fastify.register(swagger, {
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
        {
          url: 'https://your-production-domain.com',
          description: 'Production server',
        },
      ],
      tags: [
        { name: 'health', description: 'Health check endpoints' },
        { name: 'auth', description: 'Authentication endpoints' },
        { name: 'users', description: 'User management endpoints' },
        { name: 'libraries', description: 'Library management endpoints' },
        { name: 'library-access', description: 'Library access control endpoints' },
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

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
  });

  // Import routes (this will add them to swagger)
  const { registerRoutes } = await import('../src/routes/index.js');
  registerRoutes(fastify);

  // Make sure all routes are registered
  await fastify.ready();

  // Get OpenAPI spec
  const spec = fastify.swagger();

  // Ensure output directory exists
  const outputDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write OpenAPI spec to file
  const outputPath = path.join(outputDir, 'openapi.json');
  fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));

  console.log(`✅ OpenAPI specification exported to: ${outputPath}`);
  console.log('');
  console.log('📖 To import into Postman:');
  console.log('   1. Open Postman');
  console.log('   2. Click "Import" button');
  console.log(`   3. Select the file: ${outputPath}`);
  console.log('   4. Choose "OpenAPI 3.0" as the import format');
  console.log('');
  console.log('🌐 Or access it directly when server is running:');
  console.log(`   http://localhost:${PORT}/docs/json`);

  await fastify.close();
  process.exit(0);
}

exportOpenAPI().catch((err) => {
  console.error('Failed to export OpenAPI spec:', err);
  process.exit(1);
});

