import { FastifyInstance } from 'fastify';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../lib/jwt';
import { prisma } from '../lib/prisma';

// Store socket metadata
interface SocketMetadata {
  userId: number;
  email: string;
  portalViewId: string;
  role: 'controller' | 'viewer';
}

const socketMetadata = new Map<string, SocketMetadata>();

export const registerPortalViewSocket = (fastify: FastifyInstance) => {
  const io: SocketIOServer = fastify.io;

  // Namespace for portal views
  const portalViewNamespace = io.of(/^\/portal-view\/[\w-]+$/);

  portalViewNamespace.use(async (socket, next) => {
    try {
      // Extract portalViewId from namespace
      const namespace = socket.nsp.name; // e.g., "/portal-view/629d9a16-39af-4e1e-9f31-59978a800d15"
      const portalViewId = namespace.split('/').pop();

      if (!portalViewId) {
        return next(new Error('Portal view ID is required'));
      }

      // Get token from handshake
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication token is required'));
      }

      // Authenticate user
      let user;
      try {
        const decoded = verifyAccessToken(token as string);
        const dbUser = await prisma.user.findUnique({
          where: { id: decoded.userId },
        });

        if (!dbUser) {
          return next(new Error('User not found'));
        }

        user = {
          userId: decoded.userId,
          email: decoded.email,
        };
      } catch (error) {
        return next(new Error('Invalid authentication token'));
      }

      // Verify portal view exists and user has access
      const portalView = await prisma.portalView.findUnique({
        where: { id: portalViewId },
        include: {
          library: {
            include: {
              access: {
                where: { userId: user.userId },
              },
            },
          },
        },
      });

      if (!portalView) {
        return next(new Error('Portal view not found'));
      }

      const hasAccess = portalView.library.access.length > 0;
      if (!hasAccess) {
        return next(new Error('Access denied to this portal view'));
      }

      const userAccess = portalView.library.access[0];
      const role =
        userAccess.role === 'OWNER' || userAccess.role === 'EDITOR'
          ? 'controller'
          : 'viewer';

      // Store metadata
      socketMetadata.set(socket.id, {
        userId: user.userId,
        email: user.email,
        portalViewId,
        role,
      });

      // Store data on socket for easy access
      (socket as any).userId = user.userId;
      (socket as any).portalViewId = portalViewId;
      (socket as any).role = role;

      fastify.log.info({
        socketId: socket.id,
        userId: user.userId,
        portalViewId,
        role,
      }, 'Socket.IO client authenticated');

      next();
    } catch (error) {
      fastify.log.error({ error }, 'Socket.IO authentication error');
      next(new Error('Authentication failed'));
    }
  });

  portalViewNamespace.on('connection', (socket: Socket) => {
    const metadata = socketMetadata.get(socket.id);
    if (!metadata) {
      socket.disconnect();
      return;
    }

    const { userId, portalViewId, role } = metadata;

    // Join room for this portal view
    socket.join(portalViewId);

    fastify.log.info({
      socketId: socket.id,
      userId,
      portalViewId,
      role,
      roomSize: portalViewNamespace.adapter.rooms.get(portalViewId)?.size || 0,
    }, 'Socket.IO client connected to portal view');

    // Send connection confirmation
    socket.emit('connected', {
      portalViewId,
      role,
      userId,
      message: 'Successfully connected to portal view',
    });

    // Handle ping/pong
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Handle portal view updates (from controller/DM)
    socket.on('portal-view-update', async (payload) => {
      if (role !== 'controller') {
        socket.emit('error', {
          message: 'Only controllers can send updates',
        });
        return;
      }

      // Broadcast to all clients in this portal view except sender
      socket.to(portalViewId).emit('portal-view-updated', payload);

      fastify.log.info({
        userId,
        portalViewId,
        action: 'portal-view-update',
      }, 'Portal view update broadcasted');
    });

    // Handle item updates
    socket.on('item-update', async (payload) => {
      if (role !== 'controller') {
        socket.emit('error', {
          message: 'Only controllers can update items',
        });
        return;
      }

      socket.to(portalViewId).emit('item-updated', payload);

      fastify.log.info({
        userId,
        portalViewId,
        action: 'item-update',
      }, 'Item update broadcasted');
    });

    // Handle sync requests from viewers
    socket.on('request-sync', async () => {
      if (role === 'viewer') {
        // Notify controllers
        socket.to(portalViewId).emit('sync-requested', {
          from: userId,
        });

        fastify.log.info({
          userId,
          portalViewId,
          action: 'request-sync',
        }, 'Sync requested by viewer');
      }
    });

    // Handle sync response from controller
    socket.on('sync-response', async (payload) => {
      if (role === 'controller') {
        socket.to(portalViewId).emit('sync-response', payload);

        fastify.log.info({
          userId,
          portalViewId,
          action: 'sync-response',
        }, 'Sync response sent');
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      socketMetadata.delete(socket.id);

      fastify.log.info({
        socketId: socket.id,
        userId,
        portalViewId,
        reason,
        remainingInRoom: portalViewNamespace.adapter.rooms.get(portalViewId)?.size || 0,
      }, 'Socket.IO client disconnected');
    });

    // Handle errors
    socket.on('error', (error) => {
      fastify.log.error({ error, socketId: socket.id, userId, portalViewId }, 'Socket.IO error');
    });
  });

  fastify.log.info('Socket.IO portal view namespace registered');
};

/**
 * Helper function to broadcast portal view updates from REST API
 * This can be called from your REST routes when portal views are updated
 */
export async function broadcastPortalViewUpdate(
  fastify: FastifyInstance,
  portalViewId: string,
  update: any
) {
  const io: SocketIOServer = fastify.io;
  const namespace = io.of(`/portal-view/${portalViewId}`);

  namespace.emit('portal-view-updated', update);

  fastify.log.info({
    portalViewId,
    connectedClients: namespace.sockets.size,
  }, 'Portal view update broadcasted from REST API');
}
