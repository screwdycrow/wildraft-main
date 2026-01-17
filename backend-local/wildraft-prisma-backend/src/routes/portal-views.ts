import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireEditorAccess } from '../middleware/library-access';
import {
  createPortalViewSchema,
  getPortalViewsSchema,
  getPortalViewSchema,
  updatePortalViewSchema,
  deletePortalViewSchema,
} from '../schemas/portal-view.schemas';
import { broadcastPortalViewUpdate } from '../websocket/portal-view-socket';
import { validateFlexibleJson } from '../utils/json-validation';

export const portalViewRoutes = async (fastify: FastifyInstance) => {
  // Create a portal view
  fastify.post<{
    Params: { libraryId: string };
    Body: {
      name: string;
      showEncounter?: boolean;
      showHealth?: boolean;
      showAC?: boolean;
      showActions?: boolean;
      autoResetImageState?: boolean;
      combatEncounterId?: number | null;
      currentItem?: number | null;
      items?: any;
    };
  }>(
    '/:libraryId/portal-views',
    { 
      schema: createPortalViewSchema,
      preHandler: [authenticateToken, requireEditorAccess] 
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const { 
          name, 
          showEncounter, 
          showHealth, 
          showAC, 
          showActions, 
          autoResetImageState,
          combatEncounterId,
          currentItem,
          items 
        } = request.body;

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

        // Validate combatEncounterId if provided
        if (combatEncounterId !== undefined && combatEncounterId !== null) {
          const encounter = await prisma.combatEncounter.findFirst({
            where: { 
              id: combatEncounterId,
              libraryId 
            },
          });

          if (!encounter) {
            reply.code(400);
            return { error: 'Combat encounter not found in this library' };
          }
        }

        // Create the portal view
        const portalView = await prisma.portalView.create({
          data: {
            libraryId,
            name,
            showEncounter: showEncounter ?? false,
            showHealth: showHealth ?? false,
            showAC: showAC ?? false,
            showActions: showActions ?? false,
            autoResetImageState: autoResetImageState ?? false,
            combatEncounterId: combatEncounterId !== undefined ? combatEncounterId : null,
            currentItem: currentItem !== undefined ? currentItem : null,
            items: items !== undefined ? items : null,
          },
          include: {
            combatEncounter: true,
          },
        });

        // Broadcast update to all connected clients
        await broadcastPortalViewUpdate(fastify, portalView.id, {
          id: portalView.id,
          name: portalView.name,
          showEncounter: portalView.showEncounter,
          showHealth: portalView.showHealth,
          showAC: portalView.showAC,
          showActions: portalView.showActions,
          autoResetImageState: portalView.autoResetImageState,
          combatEncounterId: portalView.combatEncounterId,
          currentItem: portalView.currentItem,
          items: portalView.items,
        });

        reply.code(201);
        return {
          message: 'Portal view created successfully',
          portalView,
        };
      } catch (error) {
        console.error('Create portal view error:', error);
        reply.code(500);
        return {
          error: 'Failed to create portal view',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Get all portal views in a library
  fastify.get<{ Params: { libraryId: string } }>(
    '/:libraryId/portal-views',
    { 
      schema: getPortalViewsSchema,
      preHandler: authenticateToken 
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);

        const portalViews = await prisma.portalView.findMany({
          where: { libraryId },
          include: {
            combatEncounter: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return { portalViews };
      } catch (error) {
        console.error('Get portal views error:', error);
        reply.code(500);
        return {
          error: 'Failed to fetch portal views',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Get single portal view
  fastify.get<{ Params: { libraryId: string; portalViewId: string } }>(
    '/:libraryId/portal-views/:portalViewId',
    { 
      schema: getPortalViewSchema,
      preHandler: authenticateToken 
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const portalViewId = request.params.portalViewId;

        const portalView = await prisma.portalView.findFirst({
          where: {
            id: portalViewId,
            libraryId,
          },
          include: {
            combatEncounter: true,
          },
        });

        if (!portalView) {
          reply.code(404);
          return { error: 'Portal view not found' };
        }

        return { portalView };
      } catch (error) {
        console.error('Get portal view error:', error);
        reply.code(500);
        return {
          error: 'Failed to fetch portal view',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Update portal view
  fastify.put<{
    Params: { libraryId: string; portalViewId: string };
    Body: {
      name?: string;
      showEncounter?: boolean;
      showHealth?: boolean;
      showAC?: boolean;
      showActions?: boolean;
      autoResetImageState?: boolean;
      combatEncounterId?: number | null;
      currentItem?: number | null;
      items?: any;
    };
  }>(
    '/:libraryId/portal-views/:portalViewId',
    { 
      schema: updatePortalViewSchema,
      preHandler: [authenticateToken, requireEditorAccess] 
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const portalViewId = request.params.portalViewId;
        const { 
          name, 
          showEncounter, 
          showHealth, 
          showAC, 
          showActions, 
          autoResetImageState,
          combatEncounterId,
          currentItem,
          items 
        } = request.body;

        // Verify portal view exists in this library
        const existingPortalView = await prisma.portalView.findFirst({
          where: { id: portalViewId, libraryId },
        });

        if (!existingPortalView) {
          reply.code(404);
          return { error: 'Portal view not found' };
        }

        // Validate items JSON if provided
        if (items !== undefined && items !== null) {
          const itemsValidation = validateFlexibleJson(items, { mustBeArray: true });
          if (!itemsValidation.valid) {
            reply.code(400);
            return { error: itemsValidation.error || 'Invalid items format' };
          }
        }

        // Validate combatEncounterId if provided
        if (combatEncounterId !== undefined && combatEncounterId !== null) {
          const encounter = await prisma.combatEncounter.findFirst({
            where: { 
              id: combatEncounterId,
              libraryId 
            },
          });

          if (!encounter) {
            reply.code(400);
            return { error: 'Combat encounter not found in this library' };
          }
        }

        // Build update data object
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (showEncounter !== undefined) updateData.showEncounter = showEncounter;
        if (showHealth !== undefined) updateData.showHealth = showHealth;
        if (showAC !== undefined) updateData.showAC = showAC;
        if (showActions !== undefined) updateData.showActions = showActions;
        if (autoResetImageState !== undefined) updateData.autoResetImageState = autoResetImageState;
        if (combatEncounterId !== undefined) updateData.combatEncounterId = combatEncounterId;
        if (currentItem !== undefined) updateData.currentItem = currentItem;
        if (items !== undefined) updateData.items = items;

        // Update portal view
        const portalView = await prisma.portalView.update({
          where: { id: portalViewId },
          data: updateData,
          include: {
            combatEncounter: true,
          },
        });

        // Broadcast update to all connected clients
        await broadcastPortalViewUpdate(fastify, portalViewId, {
          id: portalView.id,
          name: portalView.name,
          showEncounter: portalView.showEncounter,
          showHealth: portalView.showHealth,
          showAC: portalView.showAC,
          showActions: portalView.showActions,
          autoResetImageState: portalView.autoResetImageState,
          combatEncounterId: portalView.combatEncounterId,
          currentItem: portalView.currentItem,
          items: portalView.items,
        });

        return {
          message: 'Portal view updated successfully',
          portalView,
        };
      } catch (error) {
        console.error('Update portal view error:', error);
        reply.code(500);
        return {
          error: 'Failed to update portal view',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Delete portal view
  fastify.delete<{ Params: { libraryId: string; portalViewId: string } }>(
    '/:libraryId/portal-views/:portalViewId',
    { 
      schema: deletePortalViewSchema,
      preHandler: [authenticateToken, requireEditorAccess] 
    },
    async (request, reply) => {
      try {
        const libraryId = parseInt(request.params.libraryId, 10);
        const portalViewId = request.params.portalViewId;

        // Verify portal view exists in this library
        const portalView = await prisma.portalView.findFirst({
          where: { id: portalViewId, libraryId },
        });

        if (!portalView) {
          reply.code(404);
          return { error: 'Portal view not found' };
        }

        await prisma.portalView.delete({
          where: { id: portalViewId },
        });

        // Broadcast deletion to all connected clients
        await broadcastPortalViewUpdate(fastify, portalViewId, {
          type: 'deleted',
          id: portalViewId,
        });

        reply.code(204);
        return;
      } catch (error) {
        console.error('Delete portal view error:', error);
        reply.code(500);
        return {
          error: 'Failed to delete portal view',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );
};

