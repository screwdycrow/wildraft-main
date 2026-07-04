import { FastifyInstance } from 'fastify';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../lib/jwt';
import { prisma } from '../lib/prisma';
import { getPlayerDmScreenAccess } from '../lib/player-access';

interface SocketMetadata {
  userId: number;
  dmScreenId: string;
  role: 'dm' | 'player';
}

const socketMetadata = new Map<string, SocketMetadata>();

/**
 * Notification-only namespace for DM screens: /dm-screen/:dmScreenId.
 * REST stays the single write path; this just tells other clients to refetch.
 */
export const registerDmScreenSocket = (fastify: FastifyInstance) => {
  const io: SocketIOServer = fastify.io;
  const namespace = io.of(/^\/dm-screen\/[\w-]+$/);

  namespace.use(async (socket, next) => {
    try {
      const dmScreenId = socket.nsp.name.split('/').pop();
      if (!dmScreenId) return next(new Error('DM screen ID is required'));

      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) return next(new Error('Authentication token is required'));

      let userId: number;
      try {
        userId = verifyAccessToken(token as string).userId;
      } catch {
        return next(new Error('Invalid authentication token'));
      }

      const dmScreen = await prisma.dMScreen.findUnique({
        where: { id: dmScreenId },
        include: { library: { include: { access: { where: { userId } } } } },
      });
      if (!dmScreen) return next(new Error('DM screen not found'));

      const access = dmScreen.library.access[0];
      if (!access) return next(new Error('Access denied'));

      let role: SocketMetadata['role'];
      if (access.role === 'OWNER' || access.role === 'EDITOR') {
        role = 'dm';
      } else if (access.role === 'PLAYER') {
        const share = await getPlayerDmScreenAccess(userId, dmScreenId);
        if (!share) return next(new Error('Access denied'));
        role = 'player';
      } else {
        role = 'player'; // viewers observe only
      }

      socketMetadata.set(socket.id, { userId, dmScreenId, role });
      next();
    } catch (error) {
      fastify.log.error({ error }, 'DM screen socket auth error');
      next(new Error('Authentication failed'));
    }
  });

  namespace.on('connection', (socket: Socket) => {
    const metadata = socketMetadata.get(socket.id);
    if (!metadata) {
      socket.disconnect();
      return;
    }
    const { userId, dmScreenId, role } = metadata;

    socket.join(dmScreenId);
    socket.emit('connected', { dmScreenId, role, userId });

    socket.on('ping', () => socket.emit('pong', { timestamp: Date.now() }));
    socket.on('disconnect', () => socketMetadata.delete(socket.id));
  });

  fastify.log.info('Socket.IO DM screen namespace registered');
};

/** Notify all clients on a DM screen that it changed and they should refetch. */
export function broadcastDmScreenUpdate(
  fastify: FastifyInstance,
  dmScreenId: string,
  info: { sourceUserId: number }
) {
  const io: SocketIOServer = fastify.io;
  io.of(`/dm-screen/${dmScreenId}`).emit('dm-screen-updated', {
    dmScreenId,
    sourceUserId: info.sourceUserId,
    timestamp: Date.now(),
  });
}
