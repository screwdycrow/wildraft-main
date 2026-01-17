import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireEditorAccess } from '../middleware/library-access';
import {
  createCombatEncounterSchema,
  getCombatEncountersSchema,
  getCombatEncounterSchema,
  updateCombatEncounterSchema,
  deleteCombatEncounterSchema,
} from '../schemas/combat-encounter.schemas';

export const combatEncounterRoutes = async (fastify: FastifyInstance) => {
  // Create a combat encounter
  fastify.post<{
    Params: { libraryId: string };
    Body: {
      name: string;
      description?: string;
      round?: number;
      initativeCount?: number;
      counters?: any;
      combatants?: any;
    };
  }>(
    '/:libraryId/encounters',
    { 
      schema: createCombatEncounterSchema,
      preHandler: [authenticateToken, requireEditorAccess] 
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const { name, description, round, initativeCount, counters, combatants } = request.body;

        // Validate required fields
        if (!name) {
          reply.code(400);
          return { error: 'Name is required' };
        }

        // Debug logging
        fastify.log.info({ counters, combatants }, 'Creating encounter with data');

        // Create the encounter
        const encounter = await prisma.combatEncounter.create({
          data: {
            libraryId,
            name,
            description,
            round: round ?? 1,
            initativeCount: initativeCount ?? 0,
            counters: counters !== undefined ? counters : null,
            combatants: combatants !== undefined ? combatants : null,
          },
          include: {
            portalViews: true,
          },
        });

        fastify.log.info({ 
          returnedCounters: encounter.counters, 
          returnedCombatants: encounter.combatants 
        }, 'Encounter created, data returned from DB');

        reply.code(201);
        return {
          message: 'Combat encounter created successfully',
          encounter,
        };
      } catch (error) {
        console.error('Create combat encounter error:', error);
        reply.code(500);
        return {
          error: 'Failed to create combat encounter',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Get all combat encounters in a library
  fastify.get<{ Params: { libraryId: string } }>(
    '/:libraryId/encounters',
    { 
      schema: getCombatEncountersSchema,
      preHandler: authenticateToken 
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);

        const encounters = await prisma.combatEncounter.findMany({
          where: { libraryId },
          include: {
            portalViews: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return { encounters };
      } catch (error) {
        console.error('Get combat encounters error:', error);
        reply.code(500);
        return {
          error: 'Failed to fetch combat encounters',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Get single combat encounter
  fastify.get<{ Params: { libraryId: string; encounterId: string } }>(
    '/:libraryId/encounters/:encounterId',
    { 
      schema: getCombatEncounterSchema,
      preHandler: authenticateToken 
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const encounterId = parseInt(request.params.encounterId, 10);

        const encounter = await prisma.combatEncounter.findFirst({
          where: {
            id: encounterId,
            libraryId,
          },
          include: {
            portalViews: true,
          },
        });

        if (!encounter) {
          reply.code(404);
          return { error: 'Combat encounter not found' };
        }

        return { encounter };
      } catch (error) {
        console.error('Get combat encounter error:', error);
        reply.code(500);
        return {
          error: 'Failed to fetch combat encounter',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Update combat encounter
  fastify.put<{
    Params: { libraryId: string; encounterId: string };
    Body: {
      name?: string;
      description?: string;
      round?: number;
      initativeCount?: number;
      counters?: any;
      combatants?: any;
    };
  }>(
    '/:libraryId/encounters/:encounterId',
    { 
      schema: updateCombatEncounterSchema,
      preHandler: [authenticateToken, requireEditorAccess] 
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const encounterId = parseInt(request.params.encounterId, 10);
        const { name, description, round, initativeCount, counters, combatants } = request.body;

        // Verify encounter exists in this library
        const existingEncounter = await prisma.combatEncounter.findFirst({
          where: { id: encounterId, libraryId },
        });

        if (!existingEncounter) {
          reply.code(404);
          return { error: 'Combat encounter not found' };
        }

        // Debug logging
        fastify.log.info({ counters, combatants }, 'Updating encounter with data');

        // Update encounter
        const encounter = await prisma.combatEncounter.update({
          where: { id: encounterId },
          data: {
            ...(name !== undefined && { name }),
            ...(description !== undefined && { description }),
            ...(round !== undefined && { round }),
            ...(initativeCount !== undefined && { initativeCount }),
            ...(counters !== undefined && { counters }),
            ...(combatants !== undefined && { combatants }),
          },
          include: {
            portalViews: true,
          },
        });

        fastify.log.info({ 
          returnedCounters: encounter.counters, 
          returnedCombatants: encounter.combatants 
        }, 'Encounter updated, data returned from DB');

        return {
          message: 'Combat encounter updated successfully',
          encounter,
        };
      } catch (error) {
        console.error('Update combat encounter error:', error);
        reply.code(500);
        return {
          error: 'Failed to update combat encounter',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Delete combat encounter
  fastify.delete<{ Params: { libraryId: string; encounterId: string } }>(
    '/:libraryId/encounters/:encounterId',
    { 
      schema: deleteCombatEncounterSchema,
      preHandler: [authenticateToken, requireEditorAccess] 
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const encounterId = parseInt(request.params.encounterId, 10);

        // Verify encounter exists in this library
        const encounter = await prisma.combatEncounter.findFirst({
          where: { id: encounterId, libraryId },
        });

        if (!encounter) {
          reply.code(404);
          return { error: 'Combat encounter not found' };
        }

        await prisma.combatEncounter.delete({
          where: { id: encounterId },
        });

        reply.code(204);
        return;
      } catch (error) {
        console.error('Delete combat encounter error:', error);
        reply.code(500);
        return {
          error: 'Failed to delete combat encounter',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );
};


