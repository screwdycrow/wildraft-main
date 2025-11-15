import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireViewerAccess } from '../middleware/library-access';

export const versionRoutes = async (fastify: FastifyInstance) => {
  // Get current versions for a library
  fastify.get<{ Params: { libraryId: string } }>(
    '/libraries/:libraryId/versions',
    {
      preHandler: [authenticateToken, requireViewerAccess],
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);

        let version = await prisma.libraryVersion.findUnique({
          where: { libraryId },
        });

        // Create version record if it doesn't exist
        if (!version) {
          version = await prisma.libraryVersion.create({
            data: {
              libraryId,
              version: 1,
              tagsVersion: 1,
              itemsVersion: 1,
            },
          });
        }

        return {
          libraryId,
          version: version.version,
          tagsVersion: version.tagsVersion,
          itemsVersion: version.itemsVersion,
          updatedAt: version.updatedAt,
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to fetch library versions');
        reply.code(500);
        return {
          error: 'Failed to fetch library versions',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Get versions for multiple libraries (for checking all at once)
  fastify.post<{ Body: { libraryIds: number[] } }>(
    '/versions/batch',
    {
      preHandler: authenticateToken,
    },
    async (request, reply) => {
      try {
        const { libraryIds } = request.body;

        if (!Array.isArray(libraryIds) || libraryIds.length === 0) {
          return reply.code(400).send({
            error: 'Bad Request',
            message: 'libraryIds must be a non-empty array',
          });
        }

        const versions = await prisma.libraryVersion.findMany({
          where: {
            libraryId: { in: libraryIds },
          },
        });

        // Create missing version records
        const existingIds = new Set(versions.map((v) => v.libraryId));
        const missingIds = libraryIds.filter((id) => !existingIds.has(id));

        if (missingIds.length > 0) {
          await prisma.libraryVersion.createMany({
            data: missingIds.map((libraryId) => ({
              libraryId,
              version: 1,
              tagsVersion: 1,
              itemsVersion: 1,
            })),
          });

          // Fetch again to include newly created
          const allVersions = await prisma.libraryVersion.findMany({
            where: {
              libraryId: { in: libraryIds },
            },
          });

          return {
            versions: allVersions.map((v) => ({
              libraryId: v.libraryId,
              version: v.version,
              tagsVersion: v.tagsVersion,
              itemsVersion: v.itemsVersion,
              updatedAt: v.updatedAt,
            })),
          };
        }

        return {
          versions: versions.map((v) => ({
            libraryId: v.libraryId,
            version: v.version,
            tagsVersion: v.tagsVersion,
            itemsVersion: v.itemsVersion,
            updatedAt: v.updatedAt,
          })),
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to fetch batch versions');
        reply.code(500);
        return {
          error: 'Failed to fetch batch versions',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );
};

