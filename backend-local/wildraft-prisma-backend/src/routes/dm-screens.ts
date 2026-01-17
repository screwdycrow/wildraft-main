import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireEditorAccess } from '../middleware/library-access';
import {
  createDMScreenSchema,
  getDMScreensSchema,
  getDMScreenSchema,
  updateDMScreenSchema,
  deleteDMScreenSchema,
} from '../schemas/dm-screen.schemas';
import { validateFlexibleJson } from '../utils/json-validation';

export const dmScreenRoutes = async (fastify: FastifyInstance) => {
  // Create a DM screen
  fastify.post<{
    Params: { libraryId: string };
    Body: {
      name: string;
      items?: any;
      settings?: any;
    };
  }>(
    '/:libraryId/dm-screens',
    { 
      schema: createDMScreenSchema,
      preHandler: [authenticateToken, requireEditorAccess] 
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const { name, items, settings } = request.body;

        // Validate required fields
        if (!name) {
          reply.code(400);
          return { error: 'Name is required' };
        }

        // Validate items JSON if provided
        if (items !== undefined && items !== null) {
          const itemsValidation = validateFlexibleJson(items, { mustBeArray: true });
          if (!itemsValidation.valid) {
            reply.code(400);
            return { error: itemsValidation.error || 'Invalid items format' };
          }
        }

        // Validate settings JSON if provided
        if (settings !== undefined && settings !== null) {
          const settingsValidation = validateFlexibleJson(settings);
          if (!settingsValidation.valid) {
            reply.code(400);
            return { error: settingsValidation.error || 'Invalid settings format' };
          }
        }

        // Create the DM screen
        const dmScreen = await prisma.dMScreen.create({
          data: {
            libraryId,
            name,
            items: items !== undefined ? items : null,
            settings: settings !== undefined ? settings : null,
          },
        });

        reply.code(201);
        return {
          message: 'DM screen created successfully',
          dmScreen,
        };
      } catch (error) {
        console.error('Create DM screen error:', error);
        reply.code(500);
        return {
          error: 'Failed to create DM screen',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Get all DM screens in a library
  fastify.get<{ Params: { libraryId: string } }>(
    '/:libraryId/dm-screens',
    { 
      schema: getDMScreensSchema,
      preHandler: authenticateToken 
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);

        const dmScreens = await prisma.dMScreen.findMany({
          where: { libraryId },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return { dmScreens };
      } catch (error) {
        console.error('Get DM screens error:', error);
        reply.code(500);
        return {
          error: 'Failed to fetch DM screens',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Get single DM screen
  fastify.get<{ Params: { libraryId: string; dmScreenId: string } }>(
    '/:libraryId/dm-screens/:dmScreenId',
    { 
      schema: getDMScreenSchema,
      preHandler: authenticateToken 
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const dmScreenId = request.params.dmScreenId;

        const dmScreen = await prisma.dMScreen.findFirst({
          where: {
            id: dmScreenId,
            libraryId,
          },
        });

        if (!dmScreen) {
          reply.code(404);
          return { error: 'DM screen not found' };
        }

        return { dmScreen };
      } catch (error) {
        console.error('Get DM screen error:', error);
        reply.code(500);
        return {
          error: 'Failed to fetch DM screen',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Update DM screen
  fastify.put<{
    Params: { libraryId: string; dmScreenId: string };
    Body: {
      name?: string;
      items?: any;
      settings?: any;
    };
  }>(
    '/:libraryId/dm-screens/:dmScreenId',
    { 
      schema: updateDMScreenSchema,
      preHandler: [authenticateToken, requireEditorAccess] 
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const dmScreenId = request.params.dmScreenId;
        const { name, items, settings } = request.body;

        // Verify DM screen exists in this library
        const existingDMScreen = await prisma.dMScreen.findFirst({
          where: { id: dmScreenId, libraryId },
        });

        if (!existingDMScreen) {
          reply.code(404);
          return { error: 'DM screen not found' };
        }

        // Validate items JSON if provided
        if (items !== undefined && items !== null) {
          const itemsValidation = validateFlexibleJson(items, { mustBeArray: true });
          if (!itemsValidation.valid) {
            reply.code(400);
            return { error: itemsValidation.error || 'Invalid items format' };
          }
        }

        // Validate settings JSON if provided
        if (settings !== undefined && settings !== null) {
          const settingsValidation = validateFlexibleJson(settings);
          if (!settingsValidation.valid) {
            reply.code(400);
            return { error: settingsValidation.error || 'Invalid settings format' };
          }
        }

        // Build update data object
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (items !== undefined) updateData.items = items;
        if (settings !== undefined) updateData.settings = settings;

        // Update DM screen
        const dmScreen = await prisma.dMScreen.update({
          where: { id: dmScreenId },
          data: updateData,
        });

        return {
          message: 'DM screen updated successfully',
          dmScreen,
        };
      } catch (error) {
        console.error('Update DM screen error:', error);
        reply.code(500);
        return {
          error: 'Failed to update DM screen',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Delete DM screen
  fastify.delete<{ Params: { libraryId: string; dmScreenId: string } }>(
    '/:libraryId/dm-screens/:dmScreenId',
    { 
      schema: deleteDMScreenSchema,
      preHandler: [authenticateToken, requireEditorAccess] 
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const dmScreenId = request.params.dmScreenId;

        // Verify DM screen exists in this library
        const dmScreen = await prisma.dMScreen.findFirst({
          where: { id: dmScreenId, libraryId },
        });

        if (!dmScreen) {
          reply.code(404);
          return { error: 'DM screen not found' };
        }

        await prisma.dMScreen.delete({
          where: { id: dmScreenId },
        });

        reply.code(204);
        return;
      } catch (error) {
        console.error('Delete DM screen error:', error);
        reply.code(500);
        return {
          error: 'Failed to delete DM screen',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );
};

